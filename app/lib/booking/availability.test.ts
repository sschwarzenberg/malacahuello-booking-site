/**
 * Hand-rolled tests (no test runner) — exercises every conflict rule in
 * the availability engine. Run with:
 *
 *   npx tsx app/lib/booking/availability.test.ts
 *
 * Exits with non-zero status if any assertion fails.
 */

import {
  cartByDate,
  cartTotal,
  checkAvailability,
  fullDayComboPairs,
  getDateAvailability,
  isCartBookable,
  newCartId,
} from "./availability";
import type { CartItem, Experience } from "./types";

let failures = 0;
let passes = 0;

function assert(condition: unknown, label: string): void {
  if (condition) {
    passes += 1;
    return;
  }
  failures += 1;
  console.error(`FAIL: ${label}`);
}

function eq<T>(actual: T, expected: T, label: string): void {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${label} — got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
}

const fullExp: Experience = {
  id: 1,
  slug: "tolhuaca",
  emoji: "♨️",
  color: "#000",
  bgColor: "#fff",
  type: "full",
  price: 65000,
  difficulty: "easy",
  minPax: 1,
  maxPax: 12,
  includes: { es: "", en: "" },
  name: { es: "Tolhuaca", en: "Tolhuaca" },
  desc: { es: "", en: "" },
};

const halfA: Experience = { ...fullExp, id: 2, slug: "araucarias", type: "half", price: 32000, name: { es: "Araucarias", en: "Araucaria" } };
const halfB: Experience = { ...fullExp, id: 3, slug: "kayak", type: "half", price: 38000, minPax: 2, name: { es: "Kayak", en: "Kayak" } };

function item(exp: Experience, date: string, slot: CartItem["slot"], pax = 2): CartItem {
  return { cartId: newCartId(), exp, date, slot, pax };
}

const D1 = "2026-06-01";
const D2 = "2026-06-02";

// ---------- Rule 1: a half-day experience requires AM or PM ----------
{
  const r = checkAvailability({ exp: halfA, date: D1, slot: null, pax: 2, cart: [] });
  assert(!r.ok && r.reason === "slot-required", "half-day with null slot rejected");
}

// ---------- Rule 2: a full-day experience must use slot FULL ----------
{
  const r = checkAvailability({ exp: fullExp, date: D1, slot: "AM", pax: 2, cart: [] });
  assert(!r.ok && r.reason === "invalid-slot-for-type", "full-day with AM rejected");
}
{
  const r = checkAvailability({ exp: fullExp, date: D1, slot: "FULL", pax: 2, cart: [] });
  assert(r.ok, "full-day with FULL accepted");
}

// ---------- Rule 3: FULL conflicts with anything else on the same date ----------
{
  const cart = [item(fullExp, D1, "FULL")];
  const r = checkAvailability({ exp: halfA, date: D1, slot: "AM", pax: 2, cart });
  assert(!r.ok && r.reason === "full-day-collision", "AM blocked by existing FULL on same date");
}
{
  const cart = [item(halfA, D1, "AM")];
  const r = checkAvailability({ exp: fullExp, date: D1, slot: "FULL", pax: 2, cart });
  assert(!r.ok && r.reason === "full-day-collision", "FULL blocked by existing AM on same date");
}

// ---------- Rule 4: AM + AM and PM + PM collide ----------
{
  const cart = [item(halfA, D1, "AM")];
  const r = checkAvailability({ exp: halfB, date: D1, slot: "AM", pax: 2, cart });
  assert(!r.ok && r.reason === "am-collision", "AM+AM rejected");
}
{
  const cart = [item(halfA, D1, "PM")];
  const r = checkAvailability({ exp: halfB, date: D1, slot: "PM", pax: 2, cart });
  assert(!r.ok && r.reason === "pm-collision", "PM+PM rejected");
}

// ---------- Rule 5: AM + PM on the same date is the allowed combo ----------
{
  const cart = [item(halfA, D1, "AM")];
  const r = checkAvailability({ exp: halfB, date: D1, slot: "PM", pax: 2, cart });
  assert(r.ok, "AM+PM combo accepted");
}

// ---------- Rule 6: same slot on different dates is fine ----------
{
  const cart = [item(halfA, D1, "AM")];
  const r = checkAvailability({ exp: halfA, date: D2, slot: "AM", pax: 2, cart });
  assert(r.ok, "same experience on different date accepted");
}

// ---------- Rule 7: pax outside [min, max] rejected ----------
{
  const r = checkAvailability({ exp: halfB, date: D1, slot: "AM", pax: 1, cart: [] });
  assert(!r.ok && r.reason === "pax-out-of-range", "pax below min rejected");
}
{
  const r = checkAvailability({ exp: halfA, date: D1, slot: "AM", pax: 999, cart: [] });
  assert(!r.ok && r.reason === "pax-out-of-range", "pax above max rejected");
}

// ---------- Rule 8: ignoreCartId allows editing without self-conflict ----------
{
  const existing = item(halfA, D1, "AM");
  const cart = [existing];
  const r = checkAvailability({
    exp: halfA,
    date: D1,
    slot: "AM",
    pax: 3,
    cart,
    ignoreCartId: existing.cartId,
  });
  assert(r.ok, "editing item doesn't conflict with itself");
}

// ---------- getDateAvailability ----------
{
  // No conflicts → all slots open for half-day, FULL masked
  const open = getDateAvailability({ exp: halfA, date: D1, cart: [] });
  eq(open, { AM: true, PM: true, FULL: false }, "half-day: empty date all slots open");
}
{
  const open = getDateAvailability({ exp: fullExp, date: D1, cart: [] });
  eq(open, { AM: false, PM: false, FULL: true }, "full-day: empty date FULL open");
}
{
  // AM taken → PM still open, FULL blocked
  const cart = [item(halfA, D1, "AM")];
  const avail = getDateAvailability({ exp: halfB, date: D1, cart });
  eq(avail, { AM: false, PM: true, FULL: false }, "half-day: AM taken → only PM");
}
{
  // FULL taken → nothing else allowed
  const cart = [item(fullExp, D1, "FULL")];
  const half = getDateAvailability({ exp: halfA, date: D1, cart });
  eq(half, { AM: false, PM: false, FULL: false }, "FULL taken → nothing else");
  const full = getDateAvailability({ exp: fullExp, date: D1, cart });
  eq(full, { AM: false, PM: false, FULL: false }, "FULL taken → no second FULL");
}

// ---------- isCartBookable ----------
{
  assert(!isCartBookable([]), "empty cart not bookable");
  assert(isCartBookable([item(halfA, D1, "AM")]), "single valid item bookable");
  assert(
    isCartBookable([item(halfA, D1, "AM"), item(halfB, D1, "PM")]),
    "AM+PM combo bookable",
  );
  // Construct a poisoned cart and confirm we catch it.
  const bad = [item(halfA, D1, "AM"), { ...item(halfB, D1, "AM"), cartId: "force" }];
  assert(!isCartBookable(bad), "poisoned AM+AM cart rejected");
  // Item with no slot is not bookable yet.
  assert(!isCartBookable([item(halfA, D1, null)]), "no-slot item not bookable");
  // Item with no date is not bookable yet.
  assert(!isCartBookable([item(halfA, "", "AM")]), "no-date item not bookable");
}

// ---------- cartTotal & combo count ----------
{
  const cart = [item(halfA, D1, "AM", 2), item(halfB, D1, "PM", 3)];
  eq(cartTotal(cart), 32000 * 2 + 38000 * 3, "cartTotal multiplies pax");
  eq(fullDayComboPairs(cart), 1, "AM+PM same date = 1 combo");
  eq(fullDayComboPairs([item(halfA, D1, "AM"), item(halfA, D2, "AM")]), 0, "two AMs on different dates = 0 combos");
}

// ---------- cartByDate sort ----------
{
  const cart = [item(halfA, D1, "PM"), item(halfB, D1, "AM"), item(fullExp, D2, "FULL")];
  const grouped = cartByDate(cart);
  const d1 = grouped.get(D1)!.map((c) => c.slot);
  eq(d1, ["AM", "PM"], "cartByDate sorts AM before PM");
}

// ---------- summary ----------
console.log(`\n${passes} passed, ${failures} failed`);
if (failures > 0) process.exit(1);

/**
 * Pure availability engine. No React, no DOM, no I/O — safe to call
 * from the UI, from a Node test, and (later) from a server-side
 * booking handler that verifies the cart before payment.
 *
 * Single source of truth for the half/full-day conflict rules.
 */

import type {
  AvailabilityResult,
  CartItem,
  DateAvailability,
  Experience,
  Slot,
} from "./types";

/** The slot a full-day experience implicitly occupies. */
export const FULL_SLOT: Slot = "FULL";

/** Default slot for a newly-added cart item. Full-day → FULL, half-day → null (user must choose). */
export function defaultSlotFor(exp: Experience): Slot | null {
  return exp.type === "full" ? "FULL" : null;
}

/** Generate a stable cart id without depending on Date.now() collisions. */
let _seq = 0;
export function newCartId(): string {
  _seq += 1;
  return `c_${Date.now().toString(36)}_${_seq}`;
}

/**
 * Check whether a candidate cart item — defined by (experience, date, slot, pax) —
 * can be added to (or updated within) an existing cart.
 *
 * Pass `ignoreCartId` when editing an existing item so the item doesn't
 * conflict with itself.
 */
export function checkAvailability(args: {
  exp: Experience;
  date: string;
  slot: Slot | null;
  pax: number;
  cart: CartItem[];
  ignoreCartId?: string;
}): AvailabilityResult {
  const { exp, date, slot, pax, cart, ignoreCartId } = args;

  if (!date) return { ok: false, reason: "date-required" };

  // Slot rules per experience type.
  if (exp.type === "full") {
    if (slot !== "FULL") return { ok: false, reason: "invalid-slot-for-type" };
  } else {
    if (slot !== "AM" && slot !== "PM") {
      return { ok: false, reason: slot == null ? "slot-required" : "invalid-slot-for-type" };
    }
  }

  if (pax < exp.minPax || pax > exp.maxPax) {
    return { ok: false, reason: "pax-out-of-range" };
  }

  // Conflict scan: only items on the same calendar date matter.
  for (const other of cart) {
    if (other.cartId === ignoreCartId) continue;
    if (other.date !== date) continue;
    if (!other.slot) continue; // half-day item without a chosen slot can't conflict yet

    // FULL collides with anything on the same date.
    if (slot === "FULL" || other.slot === "FULL") {
      return { ok: false, conflictWith: other, reason: "full-day-collision" };
    }
    // Same half-day slot collides.
    if (slot === "AM" && other.slot === "AM") {
      return { ok: false, conflictWith: other, reason: "am-collision" };
    }
    if (slot === "PM" && other.slot === "PM") {
      return { ok: false, conflictWith: other, reason: "pm-collision" };
    }
    // AM + PM on same date is the allowed combo — keep scanning.
  }

  return { ok: true };
}

/**
 * For a given date and a candidate experience, return which slots are
 * still pickable given the rest of the cart. Used by the date picker
 * to disable conflicting options in real time.
 */
export function getDateAvailability(args: {
  exp: Experience;
  date: string;
  cart: CartItem[];
  ignoreCartId?: string;
}): DateAvailability {
  const { exp, date, cart, ignoreCartId } = args;
  const result: DateAvailability = { AM: true, PM: true, FULL: true };

  for (const other of cart) {
    if (other.cartId === ignoreCartId) continue;
    if (other.date !== date) continue;
    if (!other.slot) continue;

    if (other.slot === "FULL") {
      result.AM = false;
      result.PM = false;
      result.FULL = false;
      break;
    }
    if (other.slot === "AM") {
      result.AM = false;
      result.FULL = false;
    }
    if (other.slot === "PM") {
      result.PM = false;
      result.FULL = false;
    }
  }

  // Mask by experience type: full-day experiences only care about FULL,
  // half-day experiences only care about AM/PM.
  if (exp.type === "full") {
    result.AM = false;
    result.PM = false;
  } else {
    result.FULL = false;
  }

  return result;
}

/** True iff every cart item has a date AND a valid slot AND no conflicts. */
export function isCartBookable(cart: CartItem[]): boolean {
  if (cart.length === 0) return false;
  // Build incrementally and re-check each addition against the prefix to detect any pair conflict.
  const seen: CartItem[] = [];
  for (const item of cart) {
    const r = checkAvailability({
      exp: item.exp,
      date: item.date,
      slot: item.slot,
      pax: item.pax,
      cart: seen,
    });
    if (!r.ok) return false;
    seen.push(item);
  }
  return true;
}

/** Sum the cart, multiplying each item's price by its participant count. */
export function cartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, c) => sum + c.exp.price * (c.pax || 1), 0);
}

/** Group cart items by date for itinerary summaries. */
export function cartByDate(cart: CartItem[]): Map<string, CartItem[]> {
  const m = new Map<string, CartItem[]>();
  for (const item of cart) {
    if (!item.date) continue;
    const list = m.get(item.date) ?? [];
    list.push(item);
    m.set(item.date, list);
  }
  // Sort within each date so AM appears before PM appears before FULL.
  const order: Record<string, number> = { AM: 0, PM: 1, FULL: 2 };
  for (const list of m.values()) {
    list.sort((a, b) => (order[a.slot ?? "FULL"] ?? 9) - (order[b.slot ?? "FULL"] ?? 9));
  }
  return m;
}

/** Count of pairs that form a complete "AM + PM same date" combo. */
export function fullDayComboPairs(cart: CartItem[]): number {
  let pairs = 0;
  for (const list of cartByDate(cart).values()) {
    const hasAM = list.some((c) => c.slot === "AM");
    const hasPM = list.some((c) => c.slot === "PM");
    if (hasAM && hasPM) pairs += 1;
  }
  return pairs;
}

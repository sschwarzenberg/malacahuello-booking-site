/**
 * Booking domain types — shared across UI, cart, and (future) backend.
 *
 * Conflict rules on a single calendar date:
 *   - FULL conflicts with FULL, AM, and PM (occupies the whole day)
 *   - AM   conflicts with AM and FULL
 *   - PM   conflicts with PM and FULL
 *   - AM + PM on the same date is the allowed "combo"
 */

export type ExperienceType = "full" | "half";

/** Time slot on a given date. FULL is reserved for full-day experiences. */
export type Slot = "AM" | "PM" | "FULL";

export type Difficulty = "easy" | "medium" | "hard";

export type Localized = { es: string; en: string };

export interface Experience {
  id: number;
  slug: string;
  emoji: string;
  color: string;
  bgColor: string;
  type: ExperienceType;
  price: number;
  difficulty: Difficulty;
  minPax: number;
  maxPax: number;
  includes: Localized;
  name: Localized;
  desc: Localized;
  /** Defaults to true when undefined. */
  available?: boolean;
}

/** A single line in the customer's itinerary. */
export interface CartItem {
  /** Unique id within the cart (not the experience id). */
  cartId: string;
  exp: Experience;
  /** YYYY-MM-DD; empty string means "not yet chosen". */
  date: string;
  /** null until the customer picks a slot. Full-day experiences auto-set to FULL. */
  slot: Slot | null;
  pax: number;
}

/** Result of validating a candidate (date, slot) against the existing cart. */
export interface AvailabilityResult {
  ok: boolean;
  /** Conflicting cart item, if any. */
  conflictWith?: CartItem;
  /** Machine-readable reason. */
  reason?:
    | "slot-required"
    | "invalid-slot-for-type"
    | "full-day-collision"
    | "am-collision"
    | "pm-collision"
    | "pax-out-of-range"
    | "date-required";
}

/** What slots are still available on a given date given the rest of the cart. */
export interface DateAvailability {
  AM: boolean;
  PM: boolean;
  FULL: boolean;
}

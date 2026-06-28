// Derived values: Scale and Negentropy (TECH_ARCHITECTURE §3, BALANCING §4–5).
// Pure functions recomputed from state — never stored as source of truth.
// Real formulas land in milestone 3. Scaffold returns zero so UI can bind now.

import Decimal from "break_infinity.js";
import type { GameState } from "../state/schema.ts";

/** In-run hero number: the universe's visible diameter. */
export function deriveScale(_state: GameState): Decimal {
  return new Decimal(0);
}

/** In-run ripeness: stored order that converts to Entropy on Consume. */
export function deriveNegentropy(_state: GameState): Decimal {
  return new Decimal(0);
}

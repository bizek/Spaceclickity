// Consume → Entropy prestige (TECH_ARCHITECTURE §3, BALANCING §6).
// Real formula + reset-to-Big-Bang land in milestone 4. Scaffold stubs the API.

import Decimal from "break_infinity.js";
import type { GameState } from "../state/schema.ts";

/** How much Entropy a Consume would yield right now (preview, pure). */
export function previewEntropyGain(_state: GameState): Decimal {
  return new Decimal(0);
}

/** Perform a Consume: convert Negentropy → Entropy, reset to a new Big Bang. */
export function consume(_state: GameState): void {
  // Milestone 4: apply entropyGain, increment cycle, reset per-run state.
}

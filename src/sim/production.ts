// Energy / idle production math (TECH_ARCHITECTURE §3, BALANCING §2).
// Game logic lives ONLY here in sim/. Render & UI never mutate currencies.
// Milestone 1: no-op step (no generators yet). Real production lands in M2/M3.

import type { GameState } from "../state/schema.ts";

/**
 * Advance the simulation by one fixed timestep.
 * @param _state mutated in place by the store updater
 * @param _dtSeconds fixed timestep length in seconds
 */
export function step(_state: GameState, _dtSeconds: number): void {
  // Milestone 2: add generator income, tap accumulation, multipliers.
}

// Offline / AFK progress (TECH_ARCHITECTURE §3, BALANCING §8).
// On load, fast-forward production for the elapsed wall-clock time. Generous and
// never punishing — the AFK payoff should feel like a gift. Game logic; sim/.

import Decimal from "break_infinity.js";
import { balance } from "../data/balance.ts";
import type { GameState } from "../state/schema.ts";
import { energyPerSecond } from "./production.ts";
import { offlineCapHoursBonus, offlineEfficiencyBonus } from "./disciplines.ts";
import { galaxyOfflineEfficiencyBonus } from "./galaxies.ts";

/** Hard ceiling on offline efficiency so AFK can't run away (balance guard). */
const MAX_OFFLINE_EFFICIENCY = 2.0;

export interface OfflineResult {
  /** Elapsed time credited (after the cap), in seconds. */
  seconds: number;
  /** Energy granted. */
  gained: Decimal;
  /** Whether the elapsed time was clamped by the cap. */
  capped: boolean;
}

/**
 * Apply offline production based on `lastSaved`, mutating state. Stamps
 * `lastSaved = now`. Returns a summary, or null if nothing meaningful elapsed.
 */
export function applyOfflineProgress(
  state: GameState,
  now: number = Date.now(),
): OfflineResult | null {
  const last = state.lastSaved ?? now;
  const elapsed = Math.max(0, (now - last) / 1000);
  state.lastSaved = now;
  if (elapsed < 1) return null;

  // Time-tree nodes extend the cap and the efficiency.
  const cap = (balance.offline.capHours + offlineCapHoursBonus(state)) * 3600;
  const seconds = Math.min(elapsed, cap);
  const capped = elapsed > cap;

  const rate = energyPerSecond(state);
  if (rate.lte(0)) return null;

  const efficiency = Math.min(
    balance.offline.efficiency +
      offlineEfficiencyBonus(state) +
      galaxyOfflineEfficiencyBonus(state),
    MAX_OFFLINE_EFFICIENCY,
  );
  const gained = rate.mul(seconds).mul(efficiency);
  state.energy = state.energy.add(gained);
  return { seconds, gained, capped };
}

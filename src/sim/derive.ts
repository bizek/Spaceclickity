// Derived values: Scale and Negentropy (TECH_ARCHITECTURE §3, BALANCING §4–5).
// Pure functions recomputed from state — never stored as source of truth.

import Decimal from "break_infinity.js";
import { balance } from "../data/balance.ts";
import { generatorsForTier } from "../data/generators.ts";
import { tiers, type TierDef } from "../data/tiers.ts";
import type { GameState } from "../state/schema.ts";

function isUnlocked(state: GameState, tier: TierDef): boolean {
  return (state.tierLevels[tier.id] ?? 0) > 0;
}

/** How developed a tier is: total generators built within it. */
export function tierProgress(state: GameState, tier: TierDef): number {
  let count = 0;
  for (const gen of generatorsForTier(tier.id)) {
    count += state.generators[gen.id] ?? 0;
  }
  return count;
}

/**
 * In-run hero number: the universe's visible diameter.
 *   Scale = baseScale * Σ unlocked tiers ( scaleContribution * (1 + progress) )
 * Unlocking a tier bumps Scale; each generator within it grows it further, so
 * the on-screen universe climbs smoothly and visibly during a run.
 */
export function deriveScale(state: GameState): Decimal {
  let sum = new Decimal(0);
  for (const tier of tiers) {
    if (!isUnlocked(state, tier)) continue;
    const progress = tierProgress(state, tier);
    sum = sum.add(new Decimal(tier.scaleContribution).mul(1 + progress));
  }
  return sum.mul(balance.baseScale);
}

/**
 * In-run ripeness: stored order that converts to Entropy on Consume.
 *   Negentropy = Σ unlocked tiers ( negentropyWeight * f(progress) )
 * f is a gentle concave function (sqrt) of how developed the tier is, so early
 * development pays off fast and then flattens — riper universes feed more.
 */
export function deriveNegentropy(state: GameState): Decimal {
  let sum = new Decimal(0);
  for (const tier of tiers) {
    if (!isUnlocked(state, tier)) continue;
    const f = Math.sqrt(1 + tierProgress(state, tier));
    sum = sum.add(new Decimal(tier.negentropyWeight).mul(f));
  }
  return sum;
}

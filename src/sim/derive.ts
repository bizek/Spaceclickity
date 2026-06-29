// Derived values: Scale and Negentropy (TECH_ARCHITECTURE §3, BALANCING §4–5).
// Pure functions recomputed from state — never stored as source of truth.

import Decimal from "break_infinity.js";
import { balance } from "../data/balance.ts";
import { generatorsForTier } from "../data/generators.ts";
import { tiers, type TierDef } from "../data/tiers.ts";
import type { GameState } from "../state/schema.ts";
import { negentropyWeightMultiplier } from "./disciplines.ts";
import { galaxyNegentropyMultiplier, galaxyScaleMultiplier } from "./galaxies.ts";
import { sourceDensityMultiplier, sourceMassMultiplier } from "./generatorUpgrades.ts";

function isUnlocked(state: GameState, tier: TierDef): boolean {
  return (state.tierLevels[tier.id] ?? 0) > 0;
}

/** How developed a tier is: total generators built within it (unweighted). */
export function tierProgress(state: GameState, tier: TierDef): number {
  let count = 0;
  for (const gen of generatorsForTier(tier.id)) {
    count += state.generators[gen.id] ?? 0;
  }
  return count;
}

/**
 * Tier progress with each source's count weighted by a per-source multiplier
 * (Mass for Scale, Density for Negentropy). With no upgrades the weight is 1 for
 * every source, so this collapses to `tierProgress` — keeping the derived values
 * continuous with their pre-P3a definitions.
 */
function weightedTierProgress(
  state: GameState,
  tier: TierDef,
  weight: (state: GameState, sourceId: string) => Decimal,
): Decimal {
  let sum = new Decimal(0);
  for (const gen of generatorsForTier(tier.id)) {
    const count = state.generators[gen.id] ?? 0;
    if (count <= 0) continue;
    sum = sum.add(weight(state, gen.id).mul(count));
  }
  return sum;
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
    // Mass pip-upgrades weight each source's contribution to Scale.
    const progress = weightedTierProgress(state, tier, sourceMassMultiplier);
    sum = sum.add(new Decimal(tier.scaleContribution).mul(progress.add(1)));
  }
  return sum.mul(balance.baseScale).mul(galaxyScaleMultiplier(state));
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
    // Density pip-upgrades weight each source's contribution to ripeness.
    const progress = weightedTierProgress(state, tier, sourceDensityMultiplier);
    const f = Math.sqrt(progress.add(1).toNumber());
    sum = sum.add(new Decimal(tier.negentropyWeight).mul(f));
  }
  // Hunger nodes (Event Horizon) make every galaxy read riper; an elliptical
  // target galaxy adds a further small ripeness bonus (Galaxy Rescope G2).
  return sum.mul(negentropyWeightMultiplier(state)).mul(galaxyNegentropyMultiplier(state));
}

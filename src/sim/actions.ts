// Player intents — the only mutations UI is allowed to request (via the store).
// All game logic stays in sim/ (CLAUDE.md: separation is sacred).

import Decimal from "break_infinity.js";
import { balance } from "../data/balance.ts";
import { generators, type GeneratorDef } from "../data/generators.ts";
import { tiers, type TierDef } from "../data/tiers.ts";
import type { GameState } from "../state/schema.ts";
import { tierMultiplier } from "./production.ts";
import { prestigeEnergyMultiplier, prestigeTierCostMultiplier } from "./prestige.ts";
import { genCostMultiplier, hasUnlock, tapMultiplier } from "./disciplines.ts";
import { galaxyChannelMultiplier } from "./galaxies.ts";
import {
  generatorUpgradeCost,
  generatorUpgradeLevel,
  sourceEfficiencyMultiplier,
} from "./generatorUpgrades.ts";
import type { UpgradeTrackId } from "../data/generatorUpgrades.ts";

function findGenerator(id: string): GeneratorDef | undefined {
  return generators.find((g) => g.id === id);
}

/**
 * Hold-to-channel rate at full intensity (Energy/sec), scaled by the same tier +
 * permanent multipliers as idle so channeling stays relevant as you climb.
 * `tapMultiplier` (Matter: Catalytic Spark) now reads as the channel multiplier.
 */
export function channelRate(state: GameState): Decimal {
  return new Decimal(balance.baseChannelPerSecond)
    .mul(tierMultiplier(state))
    .mul(prestigeEnergyMultiplier(state))
    .mul(tapMultiplier(state))
    .mul(galaxyChannelMultiplier(state));
}

/** Channel Energy for `seconds` at a 0..1 `intensity` (the hold ramp). */
export function channel(state: GameState, seconds: number, intensity: number): void {
  if (seconds <= 0 || intensity <= 0) return;
  const gain = channelRate(state).mul(seconds * intensity);
  state.energy = state.energy.add(gain);
}

/**
 * Closed-form geometric cost to buy `count` units starting from `owned`:
 *   baseCost * g^owned * (g^count - 1) / (g - 1)
 * (Never loop — BALANCING §2.)
 */
export function costForN(def: GeneratorDef, owned: number, count: number): Decimal {
  if (count <= 0) return new Decimal(0);
  const g = def.costGrowth;
  const base = new Decimal(def.baseCost).mul(Decimal.pow(g, owned));
  const series = Decimal.pow(g, count).sub(1).div(g - 1);
  return base.mul(series);
}

/** Largest `count` affordable with `energy`, given `owned` already held. Closed-form. */
export function maxAffordable(def: GeneratorDef, owned: number, energy: Decimal): number {
  const g = def.costGrowth;
  const base = new Decimal(def.baseCost).mul(Decimal.pow(g, owned));
  // Solve baseCost*g^owned*(g^k - 1)/(g-1) <= energy  for the largest integer k.
  const ratio = energy.mul(g - 1).div(base).add(1);
  if (ratio.lte(1)) return 0;
  const k = Math.floor(ratio.log10() / Math.log10(g));
  return Math.max(0, k);
}

/**
 * Combined per-unit cost multiplier: permanent (Matter) cost reductions × this
 * source's per-run Efficiency pip-upgrades. ≤1; 1 when neither is owned.
 */
function genCostFactor(state: GameState, def: GeneratorDef): Decimal {
  return genCostMultiplier(state).mul(sourceEfficiencyMultiplier(state, def.id));
}

/** Generator cost after permanent cost reductions and this source's Efficiency. */
export function effectiveGenCost(
  state: GameState,
  def: GeneratorDef,
  owned: number,
  count: number,
): Decimal {
  return costForN(def, owned, count).mul(genCostFactor(state, def));
}

/**
 * `maxAffordable` accounting for the cost multiplier. Since every cost scales by
 * r (≤1), affordability is equivalent to having energy/r at full price.
 */
export function maxAffordableFor(
  state: GameState,
  def: GeneratorDef,
  owned: number,
  energy: Decimal,
): number {
  return maxAffordable(def, owned, energy.div(genCostFactor(state, def)));
}

/** Buy `count` units of a generator if affordable. Returns whether it succeeded. */
export function buyGenerator(state: GameState, id: string, count: number): boolean {
  if (count <= 0) return false;
  const def = findGenerator(id);
  if (def === undefined) return false;

  const owned = state.generators[id] ?? 0;
  const cost = effectiveGenCost(state, def, owned, count);
  if (state.energy.lt(cost)) return false;

  state.energy = state.energy.sub(cost);
  state.generators[id] = owned + count;
  return true;
}

/**
 * Buy the next pip on a source's upgrade track (Rate/Efficiency/Mass/Density)
 * with per-run Energy (P3a). No-op if the source is unknown, the track is maxed,
 * or Energy is insufficient. Returns whether a pip was bought.
 */
export function buyGeneratorUpgrade(
  state: GameState,
  sourceId: string,
  trackId: UpgradeTrackId,
): boolean {
  if (findGenerator(sourceId) === undefined) return false;
  const cost = generatorUpgradeCost(state, sourceId, trackId);
  if (cost === null || state.energy.lt(cost)) return false;

  state.energy = state.energy.sub(cost);
  const tracks = state.generatorUpgrades[sourceId] ?? {};
  tracks[trackId] = generatorUpgradeLevel(state, sourceId, trackId) + 1;
  state.generatorUpgrades[sourceId] = tracks;
  return true;
}

function isTierUnlocked(state: GameState, tierId: string): boolean {
  return (state.tierLevels[tierId] ?? 0) > 0;
}

/**
 * Automation (Time: Clockwork Hands). If unlocked, buy one unit of the cheapest
 * affordable generator whose tier is unlocked. Called once per sim tick; gentle
 * by design (one purchase/tick) so it never races ahead of manual tier unlocks.
 */
export function autoBuyCheapest(state: GameState): boolean {
  if (!hasUnlock(state, "autoBuyGenerators")) return false;

  let bestId: string | undefined;
  let bestCost: Decimal | undefined;
  for (const def of generators) {
    if (!isTierUnlocked(state, def.requiresTier)) continue;
    const owned = state.generators[def.id] ?? 0;
    const cost = effectiveGenCost(state, def, owned, 1);
    if (state.energy.lt(cost)) continue;
    if (bestCost === undefined || cost.lt(bestCost)) {
      bestCost = cost;
      bestId = def.id;
    }
  }
  if (bestId === undefined) return false;
  return buyGenerator(state, bestId, 1);
}

/**
 * The next tier the player can work toward: the first locked tier whose
 * predecessor is unlocked. Returns undefined once the whole ladder is owned.
 */
export function nextUnlockableTier(state: GameState): TierDef | undefined {
  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    if (tier === undefined || isTierUnlocked(state, tier.id)) continue;
    const prev = tiers[i - 1];
    if (i === 0 || (prev !== undefined && isTierUnlocked(state, prev.id))) {
      return tier;
    }
  }
  return undefined;
}

/** Tier unlock cost after permanent (Entropy) discounts. */
export function effectiveUnlockCost(state: GameState, tier: TierDef): Decimal {
  return new Decimal(tier.unlockCost).mul(prestigeTierCostMultiplier(state));
}

/** Climb the ladder: unlock the given tier if it's next and affordable. */
export function unlockTier(state: GameState, tierId: string): boolean {
  const next = nextUnlockableTier(state);
  if (next === undefined || next.id !== tierId) return false;

  const cost = effectiveUnlockCost(state, next);
  if (state.energy.lt(cost)) return false;

  state.energy = state.energy.sub(cost);
  state.tierLevels[tierId] = 1;
  // The tier's fact-unlock is recorded by checkFactUnlocks() on the next tick.
  return true;
}

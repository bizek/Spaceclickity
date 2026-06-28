// Player intents — the only mutations UI is allowed to request (via the store).
// All game logic stays in sim/ (CLAUDE.md: separation is sacred).

import Decimal from "break_infinity.js";
import { balance } from "../data/balance.ts";
import { generators, type GeneratorDef } from "../data/generators.ts";
import { tiers, type TierDef } from "../data/tiers.ts";
import type { GameState } from "../state/schema.ts";
import { tierMultiplier } from "./production.ts";
import { prestigeEnergyMultiplier, prestigeTierCostMultiplier } from "./prestige.ts";

function findGenerator(id: string): GeneratorDef | undefined {
  return generators.find((g) => g.id === id);
}

/** Active tap: grant Energy, scaled by tier + permanent multipliers so taps stay relevant. */
export function tap(state: GameState): void {
  const gain = new Decimal(balance.baseEnergyPerTap)
    .mul(tierMultiplier(state))
    .mul(prestigeEnergyMultiplier(state));
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

/** Buy `count` units of a generator if affordable. Returns whether it succeeded. */
export function buyGenerator(state: GameState, id: string, count: number): boolean {
  if (count <= 0) return false;
  const def = findGenerator(id);
  if (def === undefined) return false;

  const owned = state.generators[id] ?? 0;
  const cost = costForN(def, owned, count);
  if (state.energy.lt(cost)) return false;

  state.energy = state.energy.sub(cost);
  state.generators[id] = owned + count;
  return true;
}

function isTierUnlocked(state: GameState, tierId: string): boolean {
  return (state.tierLevels[tierId] ?? 0) > 0;
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

  // Reaching a tier reveals its fact-unlock (popups arrive in M7).
  if (!state.unlockedFacts.includes(next.factId)) {
    state.unlockedFacts.push(next.factId);
  }
  return true;
}

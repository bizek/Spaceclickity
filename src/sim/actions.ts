// Player intents — the only mutations UI is allowed to request (via the store).
// All game logic stays in sim/ (CLAUDE.md: separation is sacred).

import Decimal from "break_infinity.js";
import { balance } from "../data/balance.ts";
import { generators, type GeneratorDef } from "../data/generators.ts";
import type { GameState } from "../state/schema.ts";
import { tierMultiplier } from "./production.ts";

function findGenerator(id: string): GeneratorDef | undefined {
  return generators.find((g) => g.id === id);
}

/** Active tap: grant Energy, scaled by owned-tier multipliers so taps stay relevant. */
export function tap(state: GameState): void {
  const gain = new Decimal(balance.baseEnergyPerTap).mul(tierMultiplier(state));
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

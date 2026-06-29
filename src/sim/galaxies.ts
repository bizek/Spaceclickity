// Galaxy modifier aggregation (Galaxy Rescope G2). Game logic stays in sim/.
// Reads the current run's target galaxy from state and folds its single small
// modifier into the multipliers the rest of sim/ consumes. Depends only on
// data/ + state/ (no imports from production/derive/prestige — stays acyclic).

import Decimal from "break_infinity.js";
import {
  getArchetype,
  type GalaxyArchetype,
  type GalaxyModifierKind,
} from "../data/galaxies.ts";
import type { GameState } from "../state/schema.ts";

/** Pure getter for the current run's galaxy archetype. */
export function currentArchetype(state: GameState): GalaxyArchetype {
  return getArchetype(state.galaxy.archetypeId);
}

/** ×(1+m) if the current galaxy's modifier matches `kind`, else ×1. */
function multiplierFor(state: GameState, kind: GalaxyModifierKind): Decimal {
  const mod = currentArchetype(state).modifier;
  if (mod.kind !== kind) return new Decimal(1);
  return new Decimal(1 + mod.magnitude);
}

export function galaxyProductionMultiplier(state: GameState): Decimal {
  return multiplierFor(state, "production");
}

export function galaxyNegentropyMultiplier(state: GameState): Decimal {
  return multiplierFor(state, "negentropy");
}

export function galaxyScaleMultiplier(state: GameState): Decimal {
  return multiplierFor(state, "scale");
}

export function galaxyChannelMultiplier(state: GameState): Decimal {
  return multiplierFor(state, "channel");
}

/** Additive offline-efficiency bonus (mirrors the Time tree's offlineBoost). */
export function galaxyOfflineEfficiencyBonus(state: GameState): number {
  const mod = currentArchetype(state).modifier;
  return mod.kind === "offline" ? mod.magnitude : 0;
}

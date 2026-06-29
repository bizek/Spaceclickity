// Energy / idle production math (TECH_ARCHITECTURE §3, BALANCING §2).
// Game logic lives ONLY here in sim/. Render & UI never mutate currencies.
//
// production = baseProduction * tierMultiplier * (upgrade/prestige mults: M3/M4)
// All multipliers stack multiplicatively and are computed from config, not
// hardcoded, so production stays FPS-independent and data-driven.

import Decimal from "break_infinity.js";
import { generators } from "../data/generators.ts";
import { tiers } from "../data/tiers.ts";
import type { GameState } from "../state/schema.ts";
import { prestigeEnergyMultiplier } from "./prestige.ts";
import { tickRateMultiplier, tierEnergyMultiplier } from "./disciplines.ts";
import { galaxyProductionMultiplier } from "./galaxies.ts";
import { sourceRateMultiplier } from "./generatorUpgrades.ts";

/** Product of energyMult across every owned tier. Forward-compatible with M3. */
export function tierMultiplier(state: GameState): Decimal {
  let m = new Decimal(1);
  for (const tier of tiers) {
    if ((state.tierLevels[tier.id] ?? 0) > 0) {
      m = m.mul(tier.energyMult);
    }
  }
  return m;
}

/** Total Energy produced per second from idle generators. Pure. */
export function energyPerSecond(state: GameState): Decimal {
  let perUnitTotal = new Decimal(0);
  for (const def of generators) {
    const count = state.generators[def.id] ?? 0;
    if (count <= 0) continue;
    // Per-generator tier bonus (e.g. Stellar Forge: Stars+ produce ×2) and this
    // source's per-run Rate pip-upgrades.
    const contribution = new Decimal(def.baseProduction)
      .mul(count)
      .mul(tierEnergyMultiplier(state, def.requiresTier))
      .mul(sourceRateMultiplier(state, def.id));
    perUnitTotal = perUnitTotal.add(contribution);
  }
  if (perUnitTotal.eq(0)) return perUnitTotal;
  return perUnitTotal
    .mul(tierMultiplier(state))
    .mul(prestigeEnergyMultiplier(state))
    .mul(tickRateMultiplier(state))
    .mul(galaxyProductionMultiplier(state));
}

/**
 * Advance the simulation by one fixed timestep (mutates in place via the store).
 * @param dtSeconds fixed timestep length in seconds
 */
export function step(state: GameState, dtSeconds: number): void {
  const rate = energyPerSecond(state);
  if (rate.gt(0)) {
    state.energy = state.energy.add(rate.mul(dtSeconds));
  }
}

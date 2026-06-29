// Consume → Entropy prestige (TECH_ARCHITECTURE §3, BALANCING §6–7).
// The most important curve in the game. Game logic stays in sim/.
//
// As of E3, the permanent multipliers come from the discipline trees
// (sim/disciplines.ts) instead of the old flat prestige-upgrade list.

import Decimal from "break_infinity.js";
import { balance } from "../data/balance.ts";
import { nextGalaxy } from "../data/galaxies.ts";
import type { GameState } from "../state/schema.ts";
import { deriveNegentropy } from "./derive.ts";
import {
  crossDisciplineMultiplier,
  globalMultiplier,
  hasUnlock,
  metaSoftcapMultiplier,
  nodeEffectProduct,
} from "./disciplines.ts";

// --- Permanent (Entropy) upgrade multipliers, applied to the next run ---

/** Multiplier on all Energy production from permanent nodes (≥1). */
export function prestigeEnergyMultiplier(state: GameState): Decimal {
  return nodeEffectProduct(state, "energyMult")
    .mul(globalMultiplier(state))
    .mul(crossDisciplineMultiplier(state));
}

/** Multiplier on Negentropy→Entropy conversion (K), from permanent nodes (≥1). */
export function prestigeConversionMultiplier(state: GameState): Decimal {
  return nodeEffectProduct(state, "betterConversion");
}

/** Multiplier on tier unlock costs from permanent nodes (≤1 = cheaper). */
export function prestigeTierCostMultiplier(state: GameState): Decimal {
  return nodeEffectProduct(state, "cheaperTiers");
}

// --- The prestige formula ---

/** Entropy a Consume would yield right now. Pure; 0 if nothing ripe. */
export function previewEntropyGain(state: GameState): Decimal {
  const neg = deriveNegentropy(state);
  if (neg.lte(0)) return new Decimal(0);

  // In-run diminishing returns: sqrt of ripeness over a softcap. The Patient
  // Gravity node (minRipenessFloor) keeps the ratio from dipping below 1, so a
  // Consume never converts at a loss.
  const k = new Decimal(balance.prestige.K).mul(prestigeConversionMultiplier(state));
  let ratio = neg.div(balance.prestige.softcap);
  if (hasUnlock(state, "minRipenessFloor")) ratio = Decimal.max(ratio, 1);
  const inRun = k.mul(ratio.sqrt());

  // Meta falloff: each universe feeds the Attractor proportionally less. The
  // Tidal Reach node (metaSoftcapRaise) softens — never removes — this falloff.
  const metaSoftcap = new Decimal(balance.prestige.metaSoftcap).mul(metaSoftcapMultiplier(state));
  const metaRatio = state.entropy.div(metaSoftcap).add(1);
  const meta = new Decimal(1).div(Decimal.pow(metaRatio, balance.prestige.p));

  return inRun.mul(meta);
}

/** Perform a Consume: bank Entropy, advance the cycle, reset to a new Big Bang. */
export function consume(state: GameState): boolean {
  const gain = previewEntropyGain(state);
  if (gain.lte(0)) return false;

  state.entropy = state.entropy.add(gain);
  state.cycle += 1;

  // Reset per-run state only. Entropy, discipline nodes, unlocked facts, cycle
  // count, and settings persist across cycles.
  state.energy = new Decimal(0);
  state.generators = {};
  state.generatorUpgrades = {};
  state.tierLevels = { "quantum-foam": 1 };
  state.upgrades = {};

  // The target galaxy is NOT per-run state: it survives the reset and advances
  // to the next galaxy in the curated order (Galaxy Rescope G2).
  state.galaxy = nextGalaxy(state.galaxy);
  return true;
}

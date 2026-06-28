// Consume → Entropy prestige (TECH_ARCHITECTURE §3, BALANCING §6–7).
// The most important curve in the game. Game logic stays in sim/.

import Decimal from "break_infinity.js";
import { balance } from "../data/balance.ts";
import { prestigeUpgrades, type PrestigeUpgradeDef } from "../data/prestigeUpgrades.ts";
import type { GameState } from "../state/schema.ts";
import { deriveNegentropy } from "./derive.ts";

// --- Permanent (Entropy) upgrade multipliers, applied to the next run ---

function levelOf(state: GameState, id: string): number {
  return state.prestigeUpgrades[id] ?? 0;
}

function productOfEffect(
  state: GameState,
  effect: PrestigeUpgradeDef["effect"],
): Decimal {
  let m = new Decimal(1);
  for (const up of prestigeUpgrades) {
    if (up.effect !== effect) continue;
    const lvl = levelOf(state, up.id);
    if (lvl > 0) m = m.mul(Decimal.pow(up.magnitude, lvl));
  }
  return m;
}

/** Multiplier on all Energy production from permanent upgrades (≥1). */
export function prestigeEnergyMultiplier(state: GameState): Decimal {
  return productOfEffect(state, "energyMult");
}

/** Multiplier on Negentropy→Entropy conversion (K), from permanent upgrades (≥1). */
export function prestigeConversionMultiplier(state: GameState): Decimal {
  return productOfEffect(state, "betterConversion");
}

/** Multiplier on tier unlock costs from permanent upgrades (≤1 = cheaper). */
export function prestigeTierCostMultiplier(state: GameState): Decimal {
  return productOfEffect(state, "cheaperTiers");
}

// --- The prestige formula ---

/** Entropy a Consume would yield right now. Pure; 0 if nothing ripe. */
export function previewEntropyGain(state: GameState): Decimal {
  const neg = deriveNegentropy(state);
  if (neg.lte(0)) return new Decimal(0);

  // In-run diminishing returns: sqrt of ripeness over a softcap.
  const k = new Decimal(balance.prestige.K).mul(prestigeConversionMultiplier(state));
  const inRun = k.mul(neg.div(balance.prestige.softcap).sqrt());

  // Meta falloff: each universe feeds the Attractor proportionally less.
  const ratio = state.entropy.div(balance.prestige.metaSoftcap).add(1);
  const meta = new Decimal(1).div(Decimal.pow(ratio, balance.prestige.p));

  return inRun.mul(meta);
}

/** Perform a Consume: bank Entropy, advance the cycle, reset to a new Big Bang. */
export function consume(state: GameState): boolean {
  const gain = previewEntropyGain(state);
  if (gain.lte(0)) return false;

  state.entropy = state.entropy.add(gain);
  state.cycle += 1;

  // Reset per-run state only. Entropy, prestige upgrades, unlocked facts,
  // cycle count, and settings persist across cycles.
  state.energy = new Decimal(0);
  state.generators = {};
  state.tierLevels = { "quantum-foam": 1 };
  state.upgrades = {};
  return true;
}

// --- Permanent upgrade purchases ---

export function prestigeUpgradeCost(def: PrestigeUpgradeDef, level: number): Decimal {
  return new Decimal(def.baseCost).mul(Decimal.pow(def.costGrowth, level));
}

export function buyPrestigeUpgrade(state: GameState, id: string): boolean {
  const def = prestigeUpgrades.find((u) => u.id === id);
  if (def === undefined) return false;

  const level = levelOf(state, id);
  const cost = prestigeUpgradeCost(def, level);
  if (state.entropy.lt(cost)) return false;

  state.entropy = state.entropy.sub(cost);
  state.prestigeUpgrades[id] = level + 1;
  return true;
}

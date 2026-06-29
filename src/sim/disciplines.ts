// Discipline aggregation + purchase (Expansion E3). Game logic stays in sim/.
// Reads owned nodes from state and folds their effects into multipliers the rest
// of sim/ consumes. Mirrors the old prestige `productOfEffect` pattern, generalized
// over the data-driven node graph. Depends only on data/ + state/ (stays acyclic).

import Decimal from "break_infinity.js";
import {
  disciplines,
  type DisciplineDef,
  type NodeDef,
  type NodeEffect,
} from "../data/disciplines.ts";
import { tiers } from "../data/tiers.ts";
import type { GameState } from "../state/schema.ts";

interface NodeEntry {
  node: NodeDef;
  discipline: DisciplineDef;
}

// Flat index of every node by id, built once.
const nodeIndex = new Map<string, NodeEntry>();
for (const discipline of disciplines) {
  for (const node of discipline.nodes) {
    nodeIndex.set(node.id, { node, discipline });
  }
}

// Tier id -> ladder index, for tierEnergyMult "<tier>+" group matching.
const tierIndex = new Map<string, number>();
tiers.forEach((t, i) => tierIndex.set(t.id, i));

// Discipline id -> its capstone node id, for cross-discipline scaling.
const capstoneByDiscipline = new Map<string, string>();
for (const discipline of disciplines) {
  const cap = discipline.nodes.find((n) => n.isCapstone === true);
  if (cap !== undefined) capstoneByDiscipline.set(discipline.id, cap.id);
}

/** Floor for cost-reduction products so they can never trivialize a cost. */
const COST_REDUCTION_FLOOR = 0.05;

export function findNode(id: string): NodeEntry | undefined {
  return nodeIndex.get(id);
}

export function nodeLevel(state: GameState, id: string): number {
  return state.disciplines[id] ?? 0;
}

/** Entropy cost of the *next* level of a node. */
export function nodeCost(node: NodeDef, level: number): Decimal {
  const base = new Decimal(node.cost);
  if (node.leveled === true && node.costGrowth !== undefined) {
    return base.mul(Decimal.pow(node.costGrowth, level));
  }
  return base;
}

/** Single-purchase nodes max out at level 1; leveled nodes never max. */
export function isNodeMaxed(state: GameState, node: NodeDef): boolean {
  if (node.leveled === true) return false;
  return nodeLevel(state, node.id) > 0;
}

export function prereqsMet(state: GameState, node: NodeDef): boolean {
  return node.requires.every((reqId) => nodeLevel(state, reqId) > 0);
}

/**
 * Multiplicative product of a scalar effect's magnitude^level across every owned
 * node. `match` optionally filters by the effect's `param` (e.g. tier group).
 */
export function nodeEffectProduct(
  state: GameState,
  effect: NodeEffect,
  match?: (param: string | undefined) => boolean,
): Decimal {
  let m = new Decimal(1);
  for (const [id, entry] of nodeIndex) {
    const level = nodeLevel(state, id);
    if (level <= 0) continue;
    for (const spec of entry.node.effects) {
      if (spec.effect !== effect) continue;
      if (match !== undefined && !match(spec.param)) continue;
      m = m.mul(Decimal.pow(spec.magnitude ?? 1, level));
    }
  }
  return m;
}

/** Additive sum of a numeric effect's magnitude*level across owned nodes. */
export function nodeEffectSum(state: GameState, effect: NodeEffect): number {
  let total = 0;
  for (const [id, entry] of nodeIndex) {
    const level = nodeLevel(state, id);
    if (level <= 0) continue;
    for (const spec of entry.node.effects) {
      if (spec.effect === effect) total += (spec.magnitude ?? 0) * level;
    }
  }
  return total;
}

/** Whether any owned node grants an unlock-type effect (optionally with a param). */
export function hasUnlock(state: GameState, effect: NodeEffect, param?: string): boolean {
  for (const [id, entry] of nodeIndex) {
    if (nodeLevel(state, id) <= 0) continue;
    for (const spec of entry.node.effects) {
      if (spec.effect === effect && (param === undefined || spec.param === param)) {
        return true;
      }
    }
  }
  return false;
}

// --- Convenience aggregators consumed by the rest of sim/ ---

/** Generator-cost multiplier (≤1), floored so it can't reach zero. */
export function genCostMultiplier(state: GameState): Decimal {
  return Decimal.max(nodeEffectProduct(state, "generatorCostReduction"), COST_REDUCTION_FLOOR);
}

export function tapMultiplier(state: GameState): Decimal {
  return nodeEffectProduct(state, "tapMult");
}

export function negentropyWeightMultiplier(state: GameState): Decimal {
  return nodeEffectProduct(state, "negentropyWeightMult");
}

export function globalMultiplier(state: GameState): Decimal {
  return nodeEffectProduct(state, "globalMult");
}

export function metaSoftcapMultiplier(state: GameState): Decimal {
  return nodeEffectProduct(state, "metaSoftcapRaise");
}

/** Production cadence multiplier (Time: Quickened Tick). Idle production only. */
export function tickRateMultiplier(state: GameState): Decimal {
  return nodeEffectProduct(state, "tickRateMult");
}

/** Additive bonus hours on the offline cap (Time tree). */
export function offlineCapHoursBonus(state: GameState): number {
  return nodeEffectSum(state, "offlineCapHours");
}

/** Additive bonus to offline efficiency, 0..n (Time tree). */
export function offlineEfficiencyBonus(state: GameState): number {
  return nodeEffectSum(state, "offlineBoost");
}

/** Whether a discipline's capstone is owned. */
export function capstoneOwned(state: GameState, disciplineId: string): boolean {
  const capId = capstoneByDiscipline.get(disciplineId);
  return capId !== undefined && nodeLevel(state, capId) > 0;
}

function otherCapstonesOwned(state: GameState, exceptDisciplineId: string): number {
  let n = 0;
  for (const discipline of disciplines) {
    if (discipline.id === exceptDisciplineId) continue;
    if (capstoneOwned(state, discipline.id)) n += 1;
  }
  return n;
}

/**
 * Global production multiplier from crossDisciplineMult nodes (Void: The Pattern).
 * Each such node scales with the number of OTHER disciplines whose capstone is owned.
 */
export function crossDisciplineMultiplier(state: GameState): Decimal {
  let m = new Decimal(1);
  for (const [id, entry] of nodeIndex) {
    const level = nodeLevel(state, id);
    if (level <= 0) continue;
    for (const spec of entry.node.effects) {
      if (spec.effect !== "crossDisciplineMult") continue;
      const others = otherCapstonesOwned(state, entry.discipline.id);
      m = m.mul(Decimal.pow(1 + (spec.magnitude ?? 0) * others, level));
    }
  }
  return m;
}

/**
 * Extra production multiplier for generators of a given tier, from tierEnergyMult
 * nodes. A node param like "stars+" applies to that tier and everything above it.
 */
export function tierEnergyMultiplier(state: GameState, tierId: string): Decimal {
  const idx = tierIndex.get(tierId);
  if (idx === undefined) return new Decimal(1);
  return nodeEffectProduct(state, "tierEnergyMult", (param) => {
    if (param === undefined) return false;
    const threshold = param.endsWith("+") ? param.slice(0, -1) : param;
    const tIdx = tierIndex.get(threshold);
    return tIdx !== undefined && idx >= tIdx;
  });
}

// --- Purchase ---

export function canBuyNode(state: GameState, id: string): boolean {
  const entry = nodeIndex.get(id);
  if (entry === undefined) return false;
  const { node } = entry;
  if (isNodeMaxed(state, node) || !prereqsMet(state, node)) return false;
  return state.entropy.gte(nodeCost(node, nodeLevel(state, id)));
}

/** Buy the next level of a node if prereqs are met and Entropy suffices. */
export function buyNode(state: GameState, id: string): boolean {
  const entry = nodeIndex.get(id);
  if (entry === undefined) return false;
  const { node } = entry;
  if (isNodeMaxed(state, node) || !prereqsMet(state, node)) return false;

  const level = nodeLevel(state, id);
  const cost = nodeCost(node, level);
  if (state.entropy.lt(cost)) return false;

  state.entropy = state.entropy.sub(cost);
  state.disciplines[id] = level + 1;
  return true;
}

// Generator pip-upgrade engine (Expansion P3a). Game logic stays in sim/.
// Reads per-run upgrade levels from state and folds each source's four tracks
// (Rate / Efficiency / Mass / Density) into multipliers the rest of sim/
// consumes. Depends only on data/ + state/ (no imports from production/derive/
// actions) so the dependency graph stays acyclic — mirrors sim/disciplines.ts.

import Decimal from "break_infinity.js";
import { generators, type GeneratorDef } from "../data/generators.ts";
import {
  MAX_PIP_LEVEL,
  pipBand,
  upgradeTracks,
  type UpgradeTrackDef,
  type UpgradeTrackId,
} from "../data/generatorUpgrades.ts";
import type { GameState } from "../state/schema.ts";

const trackById = new Map<UpgradeTrackId, UpgradeTrackDef>(
  upgradeTracks.map((t) => [t.id, t]),
);
const generatorById = new Map<string, GeneratorDef>(generators.map((g) => [g.id, g]));

/** How many pips a source has bought on a track (per-run). */
export function generatorUpgradeLevel(
  state: GameState,
  sourceId: string,
  trackId: UpgradeTrackId,
): number {
  return state.generatorUpgrades[sourceId]?.[trackId] ?? 0;
}

/** Completed colour bands at a given pip level (each grants the band-boundary bonus). */
function completedBands(level: number): number {
  return Math.floor(level / pipBand.pipsPerBand);
}

/** Whether a track is fully bought out. */
export function isTrackMaxed(level: number): boolean {
  return level >= MAX_PIP_LEVEL;
}

/** Accumulated linear magnitude for a track at `level` (pips + band bonuses). */
function trackMagnitude(track: UpgradeTrackDef, level: number): number {
  return track.effectPerPip * level + track.effectBandBonus * completedBands(level);
}

/**
 * Multiplier a track applies at `level`. "amplify" tracks return ×(1+mag);
 * "reduce" (Efficiency) returns ×1/(1+mag), floored so cost can't collapse.
 * At level 0 the magnitude is 0 → multiplier 1 (continuity with pre-P3a values).
 */
function trackMultiplierAt(track: UpgradeTrackDef, level: number): Decimal {
  const mag = trackMagnitude(track, level);
  if (track.mode === "reduce") {
    return Decimal.max(new Decimal(1).div(1 + mag), pipBand.efficiencyFloor);
  }
  return new Decimal(1 + mag);
}

function multiplierFor(
  state: GameState,
  sourceId: string,
  trackId: UpgradeTrackId,
): Decimal {
  const track = trackById.get(trackId);
  if (track === undefined) return new Decimal(1);
  return trackMultiplierAt(track, generatorUpgradeLevel(state, sourceId, trackId));
}

// --- Per-source multipliers consumed by the rest of sim/ ---

/** ×production for this source (Rate track). 1 when no pips owned. */
export function sourceRateMultiplier(state: GameState, sourceId: string): Decimal {
  return multiplierFor(state, sourceId, "rate");
}

/** ×unit cost for this source (Efficiency track, ≤1). 1 when no pips owned. */
export function sourceEfficiencyMultiplier(state: GameState, sourceId: string): Decimal {
  return multiplierFor(state, sourceId, "efficiency");
}

/** ×Scale contribution for this source (Mass track). 1 when no pips owned. */
export function sourceMassMultiplier(state: GameState, sourceId: string): Decimal {
  return multiplierFor(state, sourceId, "mass");
}

/** ×Negentropy contribution for this source (Density track). 1 when no pips owned. */
export function sourceDensityMultiplier(state: GameState, sourceId: string): Decimal {
  return multiplierFor(state, sourceId, "density");
}

// --- Pip cost (per-run Energy) ---

/**
 * Energy cost of the NEXT pip on a track for a source. Scales off the source's
 * own baseCost, grows geometrically within a band, and steps up per completed
 * band. Independent of which track (cost is uniform across tracks for legibility).
 */
export function nextPipCost(def: GeneratorDef, currentLevel: number): Decimal {
  const base = new Decimal(def.baseCost).mul(pipBand.baseCostFactor);
  const withinBand = Decimal.pow(pipBand.pipCostGrowth, currentLevel);
  const bandStep = Decimal.pow(pipBand.bandCostMultiplier, completedBands(currentLevel));
  return base.mul(withinBand).mul(bandStep);
}

/** Cost of the next pip on a source/track given current state, or null if maxed. */
export function generatorUpgradeCost(
  state: GameState,
  sourceId: string,
  trackId: UpgradeTrackId,
): Decimal | null {
  const def = generatorById.get(sourceId);
  if (def === undefined) return null;
  const level = generatorUpgradeLevel(state, sourceId, trackId);
  if (isTrackMaxed(level)) return null;
  return nextPipCost(def, level);
}

// --- UI-facing band info (P3b reads this; data stays the source of truth) ---

export interface PipBandState {
  /** Active band index (0-based). */
  band: number;
  /** Pips filled within the active band (0..pipsPerBand). */
  filledPips: number;
  pipsPerBand: number;
  maxBands: number;
  /** Colour for the active band (advances as bands complete). */
  color: string;
  atMax: boolean;
}

/** Decompose a pip level into band + within-band fill for the pip-row UI. */
export function pipBandState(level: number): PipBandState {
  const atMax = isTrackMaxed(level);
  const band = atMax ? pipBand.maxBands - 1 : Math.floor(level / pipBand.pipsPerBand);
  const filledPips = atMax ? pipBand.pipsPerBand : level % pipBand.pipsPerBand;
  return {
    band,
    filledPips,
    pipsPerBand: pipBand.pipsPerBand,
    maxBands: pipBand.maxBands,
    color: pipBand.bandColors[band] ?? pipBand.bandColors[0]!,
    atMax,
  };
}

// Generator pip-upgrade matrix (Expansion P3a). Data only — the engine
// (sim/generatorUpgrades.ts) interprets these constants; never inline them in
// logic. Each generator SOURCE gains four per-run upgrade TRACKS, bought with
// Energy and reset on Consume:
//
//   Rate       — ×this source's Energy/sec production
//   Efficiency — ×this source's unit cost (≤1, i.e. cheaper)
//   Mass       — ×this source's contribution to Scale
//   Density    — ×this source's contribution to Negentropy
//
// Levels are bought as PIPS arranged in colour BANDS: 5 pips per band, several
// bands. A band boundary grants a larger effect jump and a step in cost, so each
// completed band feels like a milestone. level == total pip count.

export type UpgradeTrackId = "rate" | "efficiency" | "mass" | "density";

/** How a track's accumulated magnitude turns into a multiplier. */
export type UpgradeTrackMode = "amplify" | "reduce";

export interface UpgradeTrackDef {
  id: UpgradeTrackId;
  name: string;
  /** One-line description for the UI (P3b). */
  description: string;
  /** Short glyph used in compact pip rows. */
  symbol: string;
  /** "amplify" → ×(1+mag); "reduce" → ×1/(1+mag) (cost reduction). */
  mode: UpgradeTrackMode;
  /** Linear magnitude added per pip within a band. */
  effectPerPip: number;
  /** Extra magnitude granted at each completed band boundary. */
  effectBandBonus: number;
}

export const upgradeTracks: readonly UpgradeTrackDef[] = [
  {
    id: "rate",
    name: "Rate",
    description: "This source produces more Energy per second.",
    symbol: "▲",
    mode: "amplify",
    effectPerPip: 0.12,
    effectBandBonus: 0.5,
  },
  {
    id: "efficiency",
    name: "Efficiency",
    description: "This source's units cost less Energy.",
    symbol: "◇",
    mode: "reduce",
    effectPerPip: 0.08,
    effectBandBonus: 0.3,
  },
  {
    id: "mass",
    name: "Mass",
    description: "This source contributes more to Scale.",
    symbol: "●",
    mode: "amplify",
    effectPerPip: 0.15,
    effectBandBonus: 0.6,
  },
  {
    id: "density",
    name: "Density",
    description: "This source contributes more to Negentropy.",
    symbol: "✦",
    mode: "amplify",
    effectPerPip: 0.1,
    effectBandBonus: 0.4,
  },
] as const;

/**
 * The pip-band cost+shape curve. Per-pip cost scales off the source's own
 * `baseCost` (so high-tier sources cost more to upgrade), grows geometrically
 * within a band, and steps up at each band boundary.
 */
export const pipBand = {
  /** Pips per colour band. */
  pipsPerBand: 5,
  /** Number of bands available (extensible — raise to lengthen the track). */
  maxBands: 3,
  /** First pip's cost = source.baseCost × this. */
  baseCostFactor: 4,
  /** Per-pip geometric cost growth within the run. */
  pipCostGrowth: 1.35,
  /** Extra cost multiplier applied once per completed band. */
  bandCostMultiplier: 3,
  /** Floor on the Efficiency cost multiplier so cost can't collapse to ~0. */
  efficiencyFloor: 0.2,
  /** CSS-friendly colour per band index, advancing as bands complete (P3b). */
  bandColors: ["#4fd6c8", "#e8c170", "#c79bd6"] as const, // teal → gold → mauve
} as const;

/** Total pips available across all bands. */
export const MAX_PIP_LEVEL = pipBand.pipsPerBand * pipBand.maxBands;

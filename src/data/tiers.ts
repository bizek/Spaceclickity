// The Complexity ladder (GAME_DESIGN §6, BALANCING §3).
// Data only — engine reads this; never inline these numbers in logic.
//
// negentropyWeight grows super-linearly and spikes at Life and ??? — this is
// the game's horror engine (cultivate life to consume it riper).

/** Stable visual key consumed by render/universe.ts for per-era looks. */
export type TierVisualKey =
  | "quantum-foam"
  | "particles"
  | "atoms"
  | "stars"
  | "galaxies"
  | "life"
  | "unknown";

export interface TierDef {
  /** Stable id used in save data and lookups. */
  id: string;
  /** Display name (glossary-aligned). */
  name: string;
  /** Energy cost to unlock this tier. Steps up sharply per tier. */
  unlockCost: number;
  /** Multiplier to Energy production once owned. */
  energyMult: number;
  /** Contribution to Negentropy (the ripeness payoff). */
  negentropyWeight: number;
  /** How much this tier grows the visible Scale. */
  scaleContribution: number;
  /** Key for the render layer's per-era visual state. */
  visualKey: TierVisualKey;
  /** Fact-unlock id triggered when this tier is reached (see facts.ts). */
  factId: string;
}

export const tiers: readonly TierDef[] = [
  {
    id: "quantum-foam",
    name: "Quantum foam",
    unlockCost: 0,
    energyMult: 1,
    negentropyWeight: 1,
    scaleContribution: 1,
    visualKey: "quantum-foam",
    factId: "fact-quantum-foam",
  },
  {
    id: "particles",
    name: "Particles",
    unlockCost: 100,
    energyMult: 2,
    negentropyWeight: 8,
    scaleContribution: 10,
    visualKey: "particles",
    factId: "fact-particles",
  },
  {
    id: "atoms",
    name: "Atoms",
    unlockCost: 1e4,
    energyMult: 4,
    negentropyWeight: 60,
    scaleContribution: 1e2,
    visualKey: "atoms",
    factId: "fact-atoms",
  },
  {
    id: "stars",
    name: "Stars",
    unlockCost: 1e6,
    energyMult: 10,
    negentropyWeight: 500,
    scaleContribution: 1e4,
    visualKey: "stars",
    factId: "fact-stars",
  },
  {
    id: "galaxies",
    name: "Galaxies",
    unlockCost: 1e9,
    energyMult: 25,
    negentropyWeight: 4_000,
    scaleContribution: 1e7,
    visualKey: "galaxies",
    factId: "fact-galaxies",
  },
  {
    id: "life",
    name: "Life",
    unlockCost: 1e13,
    energyMult: 100,
    negentropyWeight: 50_000, // deliberate spike
    scaleContribution: 1e9,
    visualKey: "life",
    factId: "fact-life",
  },
  {
    id: "unknown",
    name: "???",
    unlockCost: 1e18,
    energyMult: 500,
    negentropyWeight: 500_000, // horror payoff
    scaleContribution: 1e12,
    visualKey: "unknown",
    factId: "fact-unknown",
  },
] as const;

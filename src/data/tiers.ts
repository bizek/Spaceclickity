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
  | "molecules"
  | "nebulae"
  | "stars"
  | "galaxies"
  | "clusters"
  | "life"
  | "civilization"
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
    negentropyWeight: 55,
    scaleContribution: 1e2,
    visualKey: "atoms",
    factId: "fact-atoms",
  },
  {
    id: "molecules",
    name: "Molecules",
    unlockCost: 5e4,
    energyMult: 6,
    negentropyWeight: 150,
    scaleContribution: 5e2,
    visualKey: "molecules",
    factId: "fact-molecules",
  },
  {
    id: "nebulae",
    name: "Nebulae",
    unlockCost: 2e5,
    energyMult: 8,
    negentropyWeight: 400,
    scaleContribution: 2e3,
    visualKey: "nebulae",
    factId: "fact-nebulae",
  },
  {
    id: "stars",
    name: "Stars",
    unlockCost: 1e6,
    energyMult: 10,
    negentropyWeight: 1_000,
    scaleContribution: 1e4,
    visualKey: "stars",
    factId: "fact-stars",
  },
  {
    id: "galaxies",
    name: "Galactic Disk",
    unlockCost: 1e9,
    energyMult: 25,
    negentropyWeight: 3_000,
    scaleContribution: 1e7,
    visualKey: "galaxies",
    factId: "fact-galaxies",
  },
  {
    id: "clusters",
    name: "Globular Clusters",
    unlockCost: 1e11,
    energyMult: 50,
    negentropyWeight: 9_000,
    scaleContribution: 1e8,
    visualKey: "clusters",
    factId: "fact-clusters",
  },
  {
    id: "life",
    name: "Life",
    unlockCost: 1e13,
    energyMult: 100,
    negentropyWeight: 65_000, // deliberate spike
    scaleContribution: 1e9,
    visualKey: "life",
    factId: "fact-life",
  },
  {
    id: "civilization",
    name: "Civilization",
    unlockCost: 3e15,
    energyMult: 250,
    negentropyWeight: 200_000,
    scaleContribution: 3e10,
    visualKey: "civilization",
    factId: "fact-civilization",
  },
  {
    id: "unknown",
    name: "???",
    unlockCost: 1e18,
    energyMult: 500,
    negentropyWeight: 1_400_000, // horror payoff
    scaleContribution: 1e12,
    visualKey: "unknown",
    factId: "fact-unknown",
  },
] as const;

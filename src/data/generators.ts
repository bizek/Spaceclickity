// Idle generators (TECH_ARCHITECTURE §3, BALANCING §2). Data only.
// Geometric cost: cost(n) = baseCost * costGrowth^n. Production is energy/sec
// per unit, before tier/upgrade/prestige multipliers (applied in production.ts).
//
// One generator per Complexity tier: unlocking a tier reveals its generator.
// Buying a tier's generators both produces Energy AND develops that tier, which
// is what grows Scale and Negentropy (see sim/derive.ts). Tune here, not in logic.

export interface GeneratorDef {
  /** Stable id used in save data. */
  id: string;
  name: string;
  /** Cost of the first unit. */
  baseCost: number;
  /** Per-unit cost growth (1.07–1.15; lower = faster pace). */
  costGrowth: number;
  /** Energy/sec produced per unit owned (pre-multipliers). */
  baseProduction: number;
  /** Tier id that must be owned before this generator is available. */
  requiresTier: string;
}

export const generators: readonly GeneratorDef[] = [
  {
    id: "fluctuation",
    name: "Vacuum fluctuation",
    baseCost: 10,
    costGrowth: 1.1,
    baseProduction: 0.2,
    requiresTier: "quantum-foam",
  },
  {
    id: "quark-lattice",
    name: "Quark lattice",
    baseCost: 1e2,
    costGrowth: 1.11,
    baseProduction: 5,
    requiresTier: "particles",
  },
  {
    id: "fusion-crucible",
    name: "Fusion crucible",
    baseCost: 1e4,
    costGrowth: 1.12,
    baseProduction: 150,
    requiresTier: "atoms",
  },
  {
    id: "stellar-nursery",
    name: "Stellar nursery",
    baseCost: 1e6,
    costGrowth: 1.12,
    baseProduction: 5e3,
    requiresTier: "stars",
  },
  {
    id: "galactic-spindle",
    name: "Galactic spindle",
    baseCost: 1e9,
    costGrowth: 1.13,
    baseProduction: 2e5,
    requiresTier: "galaxies",
  },
  {
    id: "primordial-substrate",
    name: "Primordial substrate",
    baseCost: 1e13,
    costGrowth: 1.14,
    baseProduction: 1e7,
    requiresTier: "life",
  },
  {
    id: "recursive-lattice",
    name: "Recursive lattice",
    baseCost: 1e18,
    costGrowth: 1.15,
    baseProduction: 5e8,
    requiresTier: "unknown",
  },
] as const;

/** Generators belonging to a given tier (currently one each). */
export function generatorsForTier(tierId: string): GeneratorDef[] {
  return generators.filter((g) => g.requiresTier === tierId);
}

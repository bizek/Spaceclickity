// Idle generators (TECH_ARCHITECTURE §3, BALANCING §2). Data only.
// Geometric cost: cost(n) = baseCost * costGrowth^n. Production is energy/sec
// per unit, before tier/upgrade/prestige multipliers (applied in production.ts).
//
// ~Two generator SOURCES per Complexity tier (P3a): unlocking a tier reveals its
// sources. Buying a tier's generators both produces Energy AND develops that
// tier, which is what grows Scale and Negentropy (see sim/derive.ts). The second
// source per tier is a costlier, beefier "rare" variant for build variety. Each
// source also carries four per-run pip-upgrade tracks (see data/generatorUpgrades.ts).
// Tune here, not in logic.

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
    id: "zero-point-well",
    name: "Zero-point well",
    baseCost: 120,
    costGrowth: 1.12,
    baseProduction: 3,
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
    id: "baryon-loom",
    name: "Baryon loom",
    baseCost: 1.2e3,
    costGrowth: 1.12,
    baseProduction: 60,
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
    id: "ionization-reef",
    name: "Ionization reef",
    baseCost: 9e4,
    costGrowth: 1.13,
    baseProduction: 1.4e3,
    requiresTier: "atoms",
  },
  {
    id: "covalent-forge",
    name: "Covalent forge",
    baseCost: 5e4,
    costGrowth: 1.12,
    baseProduction: 600,
    requiresTier: "molecules",
  },
  {
    id: "polymer-trellis",
    name: "Polymer trellis",
    baseCost: 4e5,
    costGrowth: 1.13,
    baseProduction: 5e3,
    requiresTier: "molecules",
  },
  {
    id: "nebular-cradle",
    name: "Nebular cradle",
    baseCost: 2e5,
    costGrowth: 1.12,
    baseProduction: 1.5e3,
    requiresTier: "nebulae",
  },
  {
    id: "dust-shroud",
    name: "Dust shroud",
    baseCost: 1.6e6,
    costGrowth: 1.13,
    baseProduction: 1.3e4,
    requiresTier: "nebulae",
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
    id: "supernova-anvil",
    name: "Supernova anvil",
    baseCost: 1.2e7,
    costGrowth: 1.13,
    baseProduction: 4.5e4,
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
    id: "accretion-maelstrom",
    name: "Accretion maelstrom",
    baseCost: 1.4e10,
    costGrowth: 1.14,
    baseProduction: 1.8e6,
    requiresTier: "galaxies",
  },
  {
    id: "filamentary-web",
    name: "Filamentary web",
    baseCost: 1e11,
    costGrowth: 1.13,
    baseProduction: 1.5e6,
    requiresTier: "clusters",
  },
  {
    id: "halo-loom",
    name: "Halo loom",
    baseCost: 1.3e12,
    costGrowth: 1.14,
    baseProduction: 1.2e7,
    requiresTier: "clusters",
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
    id: "metabolic-engine",
    name: "Metabolic engine",
    baseCost: 1.3e14,
    costGrowth: 1.15,
    baseProduction: 8e7,
    requiresTier: "life",
  },
  {
    id: "noospheric-array",
    name: "Noospheric array",
    baseCost: 3e15,
    costGrowth: 1.14,
    baseProduction: 8e7,
    requiresTier: "civilization",
  },
  {
    id: "dyson-choir",
    name: "Dyson choir",
    baseCost: 4e16,
    costGrowth: 1.15,
    baseProduction: 6.5e8,
    requiresTier: "civilization",
  },
  {
    id: "recursive-lattice",
    name: "Recursive lattice",
    baseCost: 1e18,
    costGrowth: 1.15,
    baseProduction: 5e8,
    requiresTier: "unknown",
  },
  {
    id: "self-referent-engine",
    name: "Self-referent engine",
    baseCost: 1.4e19,
    costGrowth: 1.16,
    baseProduction: 4e9,
    requiresTier: "unknown",
  },
] as const;

/** Generators belonging to a given tier (currently one each). */
export function generatorsForTier(tierId: string): GeneratorDef[] {
  return generators.filter((g) => g.requiresTier === tierId);
}

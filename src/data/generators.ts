// Idle generators (TECH_ARCHITECTURE §3, BALANCING §2). Data only.
// Geometric cost: cost(n) = baseCost * costGrowth^n. Production is energy/sec
// per unit, before tier/upgrade/prestige multipliers (applied in production.ts).
//
// Milestone 2 ships one generator to prove the idle loop; more unlock per tier
// in milestone 3. Keep tuning here, never in logic.

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
] as const;

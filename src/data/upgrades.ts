// Per-run upgrades (purchased with Energy). Data only.
// Populated in milestone 3 (core loop). Scaffold stub keeps the shape stable.

export interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costGrowth: number;
  /** Multiplier this upgrade applies (interpretation lives in sim/production). */
  multiplier: number;
  /** Tier id that must be unlocked before this upgrade appears. */
  requiresTier: string;
}

export const upgrades: readonly UpgradeDef[] = [];

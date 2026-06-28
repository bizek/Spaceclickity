// Permanent upgrades bought with Entropy (BALANCING §7). Data only.
// Populated in milestone 4 (prestige loop). Scaffold stub keeps the shape stable.

export type PrestigeEffect =
  | "energyMult"
  | "cheaperTiers"
  | "fasterAutomation"
  | "betterConversion" // improves K (Negentropy → Entropy)
  | "offlineBoost";

export interface PrestigeUpgradeDef {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  /** Geometric growth — higher (1.5–2.0) since these are powerful & meta. */
  costGrowth: number;
  effect: PrestigeEffect;
  /** Per-level magnitude (interpretation lives in sim/prestige). */
  magnitude: number;
}

export const prestigeUpgrades: readonly PrestigeUpgradeDef[] = [];

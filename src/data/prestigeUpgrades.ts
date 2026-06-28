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

// First-pass permanent upgrades. magnitude is the per-level factor (effect
// interpretation lives in sim/prestige.ts). Costs/growth are starting points.
export const prestigeUpgrades: readonly PrestigeUpgradeDef[] = [
  {
    id: "hunger",
    name: "Deepening Hunger",
    description: "All Energy production ×1.5 per level.",
    baseCost: 1,
    costGrowth: 1.8,
    effect: "energyMult",
    magnitude: 1.5,
  },
  {
    id: "maw",
    name: "Wider Maw",
    description: "Negentropy→Entropy conversion ×1.25 per level.",
    baseCost: 2,
    costGrowth: 2.0,
    effect: "betterConversion",
    magnitude: 1.25,
  },
  {
    id: "erosion",
    name: "Entropic Erosion",
    description: "Tier unlock costs ×0.9 per level.",
    baseCost: 3,
    costGrowth: 1.9,
    effect: "cheaperTiers",
    magnitude: 0.9,
  },
];

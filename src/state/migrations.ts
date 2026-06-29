// Save migrations (TECH_ARCHITECTURE §5). Each entry upgrades a save from
// version N to N+1 so schema changes never brick existing saves.

import { starterGalaxy } from "../data/galaxies.ts";
import { SAVE_VERSION, type SerializedGameState } from "./schema.ts";

type Migration = (save: SerializedGameState) => SerializedGameState;

/** Keyed by the version being migrated FROM. */
const migrations: Record<number, Migration> = {
  // 1 -> 2: add Consume-FX fields (M6).
  1: (save) => ({
    ...save,
    saveVersion: 2,
    seenConsumeFX: save.seenConsumeFX ?? false,
    settings: { ...save.settings, skipConsumeFX: save.settings?.skipConsumeFX ?? false },
  }),
  // 2 -> 3: add the sound setting (M9).
  2: (save) => ({
    ...save,
    saveVersion: 3,
    settings: { ...save.settings, sound: save.settings?.sound ?? false },
  }),
  // 3 -> 4: passive trees (E3). Fold the three legacy prestige upgrades into
  // their new discipline-node ids, preserving levels, then empty the legacy map.
  3: (save) => {
    const legacy = save.prestigeUpgrades ?? {};
    const disciplines: Record<string, number> = { ...(save.disciplines ?? {}) };
    const remap: Record<string, string> = {
      hunger: "matter.deepening-hunger", // Deepening Hunger (energyMult)
      erosion: "matter.entropic-erosion", // Entropic Erosion (cheaperTiers)
      maw: "hunger.wider-maw", // Wider Maw (betterConversion)
    };
    for (const [oldId, newId] of Object.entries(remap)) {
      const level = legacy[oldId] ?? 0;
      if (level > 0) disciplines[newId] = level;
    }
    return { ...save, saveVersion: 4, disciplines, prestigeUpgrades: {} };
  },
  // 4 -> 5: ladder expansion (P2). Four tiers were inserted mid-ladder:
  // Molecules+Nebulae before Stars, Clusters before Life, Civilization before
  // ???. Inserting mid-ladder means an old save can own a later tier while a
  // newly-inserted earlier one is absent. Rule: auto-unlock each inserted tier
  // whose FOLLOWING tier is already unlocked, so no progress regresses (a save
  // at Stars comes out owning Molecules+Nebulae; a save at ??? owns all four).
  //
  // Pairs are listed in ladder order [insertedTier, followingTier]; we process
  // them LATEST-first so chained insertions resolve in one pass (Molecules picks
  // up Nebulae after Nebulae has itself been unlocked off Stars).
  4: (save) => {
    const insertedThenFollowing: ReadonlyArray<readonly [string, string]> = [
      ["molecules", "nebulae"],
      ["nebulae", "stars"],
      ["clusters", "life"],
      ["civilization", "unknown"],
    ];
    const tierLevels: Record<string, number> = { ...(save.tierLevels ?? {}) };
    for (let i = insertedThenFollowing.length - 1; i >= 0; i--) {
      const pair = insertedThenFollowing[i];
      if (pair === undefined) continue;
      const [inserted, following] = pair;
      if ((tierLevels[following] ?? 0) > 0 && (tierLevels[inserted] ?? 0) <= 0) {
        tierLevels[inserted] = 1;
      }
    }
    return { ...save, saveVersion: 5, tierLevels };
  },
  // 5 -> 6: galaxy variety (Galaxy Rescope G2). Each run now targets a named
  // real galaxy with a morphology + small modifier. Old saves had no target, so
  // seed the starter archetype (a small dwarf); it advances on the next Consume.
  5: (save) => ({
    ...save,
    saveVersion: 6,
    galaxy: save.galaxy ?? starterGalaxy(),
  }),
  // 6 -> 7: generator pip-upgrades (P3a). Per-run upgrade tracks per source;
  // existing saves simply start with none owned (continuity — no multipliers).
  6: (save) => ({
    ...save,
    saveVersion: 7,
    generatorUpgrades: save.generatorUpgrades ?? {},
  }),
};

export function runMigrations(save: SerializedGameState): SerializedGameState {
  let current = save;
  while ((current.saveVersion ?? 0) < SAVE_VERSION) {
    const from = current.saveVersion ?? 0;
    const migrate = migrations[from];
    if (migrate === undefined) {
      // No path forward; stamp to current and hope fields are compatible.
      current = { ...current, saveVersion: SAVE_VERSION };
      break;
    }
    current = migrate(current);
  }
  return current;
}

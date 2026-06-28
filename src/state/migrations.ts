// Save migrations (TECH_ARCHITECTURE §5). Each entry upgrades a save from
// version N to N+1 so schema changes never brick existing saves.

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

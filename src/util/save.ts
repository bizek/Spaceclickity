// Serialize / load / offline-progress (TECH_ARCHITECTURE §5, BALANCING §8).
// Full autosave + offline catch-up land in milestones 2 & 8. Scaffold provides
// the localStorage round-trip so state survives reloads from the start.

import { runMigrations } from "../state/migrations.ts";
import {
  defaultGameState,
  deserializeGameState,
  serializeGameState,
  type GameState,
  type SerializedGameState,
} from "../state/schema.ts";

const STORAGE_KEY = "space-clickerz/save";

export function saveGame(state: GameState): void {
  const serialized = serializeGameState(state);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch (err) {
    console.warn("[save] failed to persist", err);
  }
}

export function loadGame(): GameState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return defaultGameState();

  try {
    const parsed = JSON.parse(raw) as SerializedGameState;
    const migrated = runMigrations(parsed);
    return deserializeGameState(migrated);
  } catch (err) {
    console.warn("[save] corrupt save, starting fresh", err);
    return defaultGameState();
  }
}

export function exportSave(state: GameState): string {
  return btoa(JSON.stringify(serializeGameState(state)));
}

export function importSave(encoded: string): GameState {
  const parsed = JSON.parse(atob(encoded)) as SerializedGameState;
  return deserializeGameState(runMigrations(parsed));
}

export function wipeSave(): void {
  localStorage.removeItem(STORAGE_KEY);
}

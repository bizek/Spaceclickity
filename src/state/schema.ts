// GameState: the single serializable source of truth (TECH_ARCHITECTURE §2).
// Runtime currencies are break_infinity Decimals; serialized as strings.

import Decimal from "break_infinity.js";

export const SAVE_VERSION = 1;

export interface GameState {
  saveVersion: number;

  // --- Currencies (Decimal at runtime, never raw numbers for game values) ---
  /** Per-run primary currency. */
  energy: Decimal;
  /** Permanent meta hero / leaderboard score. */
  entropy: Decimal;

  // --- Complexity ladder progression ---
  /** Tier id -> level owned (0 = unlocked/seeded, >0 = developed). */
  tierLevels: Record<string, number>;
  /** Generator id -> count owned. */
  generators: Record<string, number>;
  /** Upgrade id -> level owned (per-run). */
  upgrades: Record<string, number>;
  /** Prestige upgrade id -> level owned (permanent). */
  prestigeUpgrades: Record<string, number>;

  // --- Meta progression ---
  /** How many universes the Attractor has consumed. */
  cycle: number;
  /** Fact ids the player has unlocked. */
  unlockedFacts: string[];

  // --- Settings ---
  settings: {
    quality: "low" | "medium" | "high";
    reducedMotion: boolean;
    notation: "scientific" | "suffix";
    instability: boolean; // opt-in hard mode, off by default
  };

  // --- Bookkeeping ---
  /** Epoch ms of last save (for offline catch-up). */
  lastSaved: number;
}

/** Serialized form: Decimals become strings, everything else JSON-safe. */
export interface SerializedGameState
  extends Omit<GameState, "energy" | "entropy"> {
  energy: string;
  entropy: string;
}

export function defaultGameState(): GameState {
  return {
    saveVersion: SAVE_VERSION,
    energy: new Decimal(0),
    entropy: new Decimal(0),
    tierLevels: { "quantum-foam": 1 },
    generators: {},
    upgrades: {},
    prestigeUpgrades: {},
    cycle: 1,
    // Quantum foam is "reached" at the Big Bang, so its fact starts unlocked.
    unlockedFacts: ["fact-quantum-foam"],
    settings: {
      quality: "high",
      reducedMotion: false,
      notation: "suffix",
      instability: false,
    },
    lastSaved: Date.now(),
  };
}

export function serializeGameState(state: GameState): SerializedGameState {
  return {
    ...state,
    energy: state.energy.toString(),
    entropy: state.entropy.toString(),
  };
}

export function deserializeGameState(data: SerializedGameState): GameState {
  return {
    ...data,
    energy: new Decimal(data.energy),
    entropy: new Decimal(data.entropy),
  };
}

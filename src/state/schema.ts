// GameState: the single serializable source of truth (TECH_ARCHITECTURE §2).
// Runtime currencies are break_infinity Decimals; serialized as strings.

import Decimal from "break_infinity.js";
import { starterGalaxy, type GalaxyState } from "../data/galaxies.ts";

export const SAVE_VERSION = 7;

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
  /**
   * Per-run generator pip-upgrades (P3a): source id -> track id -> pip count.
   * Bought with Energy; cleared on Consume alongside `generators`.
   */
  generatorUpgrades: Record<string, Record<string, number>>;
  /** Upgrade id -> level owned (per-run). */
  upgrades: Record<string, number>;
  /**
   * Legacy permanent upgrades (pre-v4). Superseded by `disciplines`; the v3→v4
   * migration empties it. Kept on the type for rollback safety.
   */
  prestigeUpgrades: Record<string, number>;
  /** Discipline node id -> level owned (permanent, Entropy-bought). */
  disciplines: Record<string, number>;

  // --- Meta progression ---
  /** How many galaxies the Attractor has consumed. */
  cycle: number;
  /**
   * The galaxy this run is growing toward Consume (archetype + real name).
   * PERSISTS through the per-run reset and ADVANCES on Consume (Galaxy Rescope G2).
   */
  galaxy: GalaxyState;
  /** Fact ids the player has unlocked. */
  unlockedFacts: string[];
  /** Whether the player has watched at least one full Consume animation. */
  seenConsumeFX: boolean;

  // --- Settings ---
  settings: {
    quality: "low" | "medium" | "high";
    reducedMotion: boolean;
    notation: "scientific" | "suffix";
    instability: boolean; // opt-in hard mode, off by default
    skipConsumeFX: boolean; // skip the devour animation after first viewing
    sound: boolean; // subtle audio cues, off by default
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
    generatorUpgrades: {},
    upgrades: {},
    prestigeUpgrades: {},
    disciplines: {},
    cycle: 1,
    galaxy: starterGalaxy(),
    // Quantum foam is "reached" at the Big Bang, so its fact starts unlocked.
    unlockedFacts: ["fact-quantum-foam"],
    seenConsumeFX: false,
    settings: {
      quality: "high",
      reducedMotion: false,
      notation: "suffix",
      instability: false,
      skipConsumeFX: false,
      sound: false,
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

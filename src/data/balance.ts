// All tunable curve constants. Per CLAUDE.md: never hardcode balance in logic.
// Values are starting points from BALANCING.md §11 — meant to be retuned by feel.

export const balance = {
  /** Energy granted per active tap (before multipliers). Legacy; superseded by channeling. */
  baseEnergyPerTap: 1,

  /** Hold-to-channel: Energy/sec at full intensity (before multipliers). */
  baseChannelPerSecond: 8,
  /** Seconds of holding to ramp channel intensity 0→1 (spin-up). */
  channelRampSeconds: 1.6,

  // Generator curves live in data/generators.ts (one table per generator),
  // mirroring how tier curves live in data/tiers.ts.

  /** Consume → Entropy prestige formula constants (BALANCING.md §6). */
  prestige: {
    K: 1,
    softcap: 1e4,
    metaSoftcap: 1e9,
    p: 0.4,
  },

  /** Offline / AFK catch-up (BALANCING.md §8). */
  offline: {
    efficiency: 1.0,
    capHours: 12,
  },

  /** Scale derivation base (BALANCING.md §4). */
  baseScale: 1,

  /** Autosave cadence in milliseconds (TECH_ARCHITECTURE §5). */
  autosaveIntervalMs: 10_000,

  /** Fixed simulation timestep in milliseconds (TECH_ARCHITECTURE §3). */
  simTickMs: 100,
} as const;

export type Balance = typeof balance;

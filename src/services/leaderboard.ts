// Leaderboard behind a pluggable interface (TECH_ARCHITECTURE §7).
// Default = no-op/local so the game ships & runs fully offline. A networked
// implementation can be swapped in later behind this same interface.

export interface LeaderboardEntry {
  name: string;
  entropy: string; // serialized Decimal
}

export interface Leaderboard {
  submitScore(entropyTotal: string): Promise<void>;
  getGlobal(): Promise<LeaderboardEntry[]>;
  getFriends(): Promise<LeaderboardEntry[]>;
}

/** Local default: stores nothing networked; satisfies the interface. */
export const localLeaderboard: Leaderboard = {
  async submitScore(): Promise<void> {
    // no-op offline
  },
  async getGlobal(): Promise<LeaderboardEntry[]> {
    return [];
  },
  async getFriends(): Promise<LeaderboardEntry[]> {
    return [];
  },
};

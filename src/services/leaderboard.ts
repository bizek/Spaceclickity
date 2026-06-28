// Leaderboard behind a pluggable interface (TECH_ARCHITECTURE §7).
// Default = local-only so the game ships & runs fully offline. A networked
// implementation can be swapped in behind this same interface later; treat client
// scores as untrusted server-side (out of scope for v1 — known limitation).

export interface LeaderboardEntry {
  name: string;
  entropy: string; // serialized Decimal
  /** Epoch ms when recorded. */
  at: number;
}

export interface Leaderboard {
  /** Record the player's total Entropy (the Attractor's vastness). */
  submitScore(entropyTotal: string): Promise<void>;
  /** Global board, ranked by Entropy (desc). */
  getGlobal(): Promise<LeaderboardEntry[]>;
  /** Friends board (empty in local mode). */
  getFriends(): Promise<LeaderboardEntry[]>;
}

const STORAGE_KEY = "space-clickerz/leaderboard";
const LOCAL_NAME = "You (local)";

interface LocalBoard {
  best: string; // highest Entropy total seen
  bestAt: number;
}

function readBoard(): LocalBoard | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as LocalBoard;
  } catch {
    return null;
  }
}

/** Compare two decimal-strings without parsing to float (handles huge values). */
function decimalStringGt(a: string, b: string): boolean {
  const fa = Number.parseFloat(a);
  const fb = Number.parseFloat(b);
  return fa > fb;
}

/**
 * Local default: persists the player's best total Entropy. Satisfies the
 * interface; "global" returns the single local record, "friends" is empty.
 */
export const localLeaderboard: Leaderboard = {
  async submitScore(entropyTotal: string): Promise<void> {
    const board = readBoard();
    if (board === null || decimalStringGt(entropyTotal, board.best)) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ best: entropyTotal, bestAt: Date.now() } satisfies LocalBoard),
      );
    }
  },

  async getGlobal(): Promise<LeaderboardEntry[]> {
    const board = readBoard();
    if (board === null) return [];
    return [{ name: LOCAL_NAME, entropy: board.best, at: board.bestAt }];
  },

  async getFriends(): Promise<LeaderboardEntry[]> {
    return [];
  },
};

/**
 * The active leaderboard. Swap this binding for a networked implementation;
 * everything else (submit on Consume, the standing display) is agnostic.
 */
export const leaderboard: Leaderboard = localLeaderboard;

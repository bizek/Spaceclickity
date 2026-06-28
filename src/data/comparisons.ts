// Scale milestone comparison strings (GAME_DESIGN §9, BALANCING §4). Data only.
// Mapped to Scale at log-spaced thresholds. Fully written in milestone 7.

export interface ComparisonDef {
  /** Scale value at or above which this comparison applies. */
  threshold: number;
  text: string;
}

// Ordered ascending by threshold.
export const comparisons: readonly ComparisonDef[] = [
  { threshold: 1, text: "Your universe is smaller than an idea." },
];

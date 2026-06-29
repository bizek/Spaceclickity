// Scale milestone comparison strings (GAME_DESIGN §9, BALANCING §4). Data only.
// Mapped to Scale at log-spaced thresholds, escalating then unsettling.
// Cold, matter-of-fact (CLAUDE.md tone guardrails).

export interface ComparisonDef {
  /** Scale value at or above which this comparison applies. */
  threshold: number;
  text: string;
}

// Ordered ascending by threshold.
export const comparisons: readonly ComparisonDef[] = [
  { threshold: 1, text: "The seed of a galaxy — smaller than a thought." },
  { threshold: 10, text: "The nascent galaxy spans a single atom." },
  { threshold: 1e2, text: "A grain of dust, drifting in the dark." },
  { threshold: 5e2, text: "Molecules clasp hands in the cold — the first chemistry, indifferent." },
  { threshold: 1e3, text: "The size of a hand — had there ever been hands." },
  { threshold: 2e3, text: "A drifting cloud of gas and dust, cradling nothing yet." },
  { threshold: 1e4, text: "It now exceeds the height of a mountain." },
  { threshold: 1e5, text: "Wider than an ocean you will never let form." },
  { threshold: 1e6, text: "The span of a small, cold moon." },
  { threshold: 1e8, text: "A star, like the one meant to warm the life you intend to grow." },
  { threshold: 1e10, text: "An entire solar system turns inside it." },
  { threshold: 1e12, text: "A nebula, lightyears across, and still ripening." },
  { threshold: 1e15, text: "The bright disc of a galaxy." },
  { threshold: 1e16, text: "The galactic plane extends. The oldest stars orbit the halo in silence." },
  { threshold: 1e18, text: "The full extent dwarfs the disc. Most of the mass is invisible." },
  { threshold: 1e20, text: "Its lit worlds spell patterns; the patterns do not know they are watched." },
  { threshold: 1e21, text: "Beyond meaningful comparison. It does not know how small it is." },
  { threshold: 1e25, text: "Vast enough, now, to be worth ending." },
];

/** Index of the highest comparison whose threshold is met, or -1 if none. */
export function comparisonIndexFor(scale: number): number {
  let idx = -1;
  for (let i = 0; i < comparisons.length; i++) {
    const c = comparisons[i];
    if (c !== undefined && scale >= c.threshold) idx = i;
    else break;
  }
  return idx;
}

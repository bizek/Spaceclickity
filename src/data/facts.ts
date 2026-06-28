// Fact-unlock copy keyed by trigger (GAME_DESIGN §9). Data only.
// Tone: cold, vast, matter-of-fact. Never jokey or winking (CLAUDE.md tone guardrails).
// Fully written in milestone 7; tier-reached entries stubbed here for wiring.

export type FactTrigger =
  | { kind: "tier-reached"; tierId: string }
  | { kind: "scale-threshold"; scale: number }
  | { kind: "cycle-count"; cycles: number };

export interface FactDef {
  id: string;
  trigger: FactTrigger;
  /** Short heading shown in the popup and the cycle log. */
  title: string;
  /** Body copy. */
  body: string;
}

export const facts: readonly FactDef[] = [
  {
    id: "fact-quantum-foam",
    trigger: { kind: "tier-reached", tierId: "quantum-foam" },
    title: "A spark",
    body: "Spacetime trembles. Something that was nothing is now almost something.",
  },
];

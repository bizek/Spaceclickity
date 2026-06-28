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

// One fact per tier wired now (so the cycle-log counter stays coherent); the
// full eerie copy + Scale/cycle-triggered facts are written in milestone 7.
export const facts: readonly FactDef[] = [
  {
    id: "fact-quantum-foam",
    trigger: { kind: "tier-reached", tierId: "quantum-foam" },
    title: "A spark",
    body: "Spacetime trembles. Something that was nothing is now almost something.",
  },
  {
    id: "fact-particles",
    trigger: { kind: "tier-reached", tierId: "particles" },
    title: "First matter",
    body: "Quarks bind into the first hadrons. The universe now has a temperature.",
  },
  {
    id: "fact-atoms",
    trigger: { kind: "tier-reached", tierId: "atoms" },
    title: "Recombination",
    body: "Electrons settle into orbit. The fog clears; light travels freely for the first time.",
  },
  {
    id: "fact-stars",
    trigger: { kind: "tier-reached", tierId: "stars" },
    title: "Ignition",
    body: "Gravity wins. The first stars burn, forging the heavier elements to come.",
  },
  {
    id: "fact-galaxies",
    trigger: { kind: "tier-reached", tierId: "galaxies" },
    title: "Structure",
    body: "Matter gathers along the cosmic web. Islands of light drift in widening dark.",
  },
  {
    id: "fact-life",
    trigger: { kind: "tier-reached", tierId: "life" },
    title: "Something stirs",
    body: "On a warm world, chemistry begins to copy itself. It does not know it is being grown.",
  },
  {
    id: "fact-unknown",
    trigger: { kind: "tier-reached", tierId: "unknown" },
    title: "It looks back",
    body: "The patterns inside have grown regular. For an instant, the glow seems to consider you.",
  },
  // --- Scale-triggered (cold cosmology, then unsettling) ---
  {
    id: "fact-scale-light",
    trigger: { kind: "scale-threshold", scale: 1e8 },
    title: "Slow light",
    body: "Light now takes so long to cross the universe that its near and far halves keep different time.",
  },
  {
    id: "fact-scale-vast",
    trigger: { kind: "scale-threshold", scale: 1e15 },
    title: "Forgetting",
    body: "The early regions have forgotten the late ones. Nothing inside can see the whole of itself. You can.",
  },
  // --- Cycle-triggered (the universes may, dimly, remember) ---
  {
    id: "fact-cycle-2",
    trigger: { kind: "cycle-count", cycles: 2 },
    title: "Again",
    body: "The new universe settles into shapes subtly familiar — though nothing in it could remember the last.",
  },
  {
    id: "fact-cycle-10",
    trigger: { kind: "cycle-count", cycles: 10 },
    title: "A pattern resembling a question",
    body: "Ten universes fed. In the noise of the latest, briefly, an arrangement that looks like it is asking something.",
  },
  {
    id: "fact-cycle-50",
    trigger: { kind: "cycle-count", cycles: 50 },
    title: "Patience",
    body: "Fifty cycles. They come faster now, and smaller, and you are no fuller than when you began.",
  },
];

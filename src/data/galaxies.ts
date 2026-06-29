// Galaxy variety (Galaxy Rescope G2). Data only — each run grows & consumes a
// real galaxy with a morphology, a name drawn from a pool of REAL galaxies, an
// eerie blurb, and ONE small, never-punishing run modifier. The engine
// (sim/galaxies.ts) interprets `modifier`; never inline these numbers in logic.
//
// Modifiers reuse the existing multiplier plumbing (production / negentropy /
// scale / channel / offline). They are deliberately small (Pillar: calm, AFK,
// attention rewarded not required — no penalties).

export type GalaxyMorphology =
  | "spiral"
  | "barred-spiral"
  | "elliptical"
  | "lenticular"
  | "irregular"
  | "dwarf";

/** Which run dimension a modifier touches. Each maps to existing sim plumbing. */
export type GalaxyModifierKind =
  | "production" // ×(1+m) on Energy/sec
  | "negentropy" // ×(1+m) on ripeness (Negentropy → Entropy payoff)
  | "scale" // ×(1+m) on visible Scale
  | "channel" // ×(1+m) on hold-to-channel rate
  | "offline"; // +m to offline efficiency (additive, like the Time tree)

export interface GalaxyModifier {
  kind: GalaxyModifierKind;
  /** For multiplicative kinds: bonus fraction (0.15 → ×1.15). For offline: additive efficiency. */
  magnitude: number;
  /** Player-facing one-liner describing the boon. */
  label: string;
}

export interface GalaxyArchetype {
  /** Stable id used in save data. */
  id: string;
  morphology: GalaxyMorphology;
  /** Display label for the morphology (e.g. "Barred Spiral"). */
  morphologyName: string;
  /** Pool of REAL galaxy names this archetype draws from each run. */
  names: readonly string[];
  /** Eerie one-line blurb with a real-ish stat hook (diameter / star count). */
  blurb: string;
  /** The single small run modifier this morphology grants. */
  modifier: GalaxyModifier;
}

export const galaxyArchetypes: readonly GalaxyArchetype[] = [
  {
    id: "dwarf",
    morphology: "dwarf",
    morphologyName: "Dwarf",
    names: [
      "Leo I",
      "Sculptor Dwarf",
      "Fornax Dwarf",
      "Draco Dwarf",
      "Carina Dwarf",
      "Sagittarius Dwarf",
    ],
    blurb:
      "A few billion stars, barely bound — a thousand light-years of faint light. Small enough to swallow whole, and many have been.",
    modifier: {
      kind: "production",
      magnitude: 0.22,
      label: "Compact and quick — Energy production ×1.22.",
    },
  },
  {
    id: "irregular",
    morphology: "irregular",
    morphologyName: "Irregular",
    names: [
      "Large Magellanic Cloud",
      "Small Magellanic Cloud",
      "NGC 4449",
      "NGC 6822",
      "IC 10",
      "NGC 1427A",
    ],
    blurb:
      "No symmetry, no center, no plan. Torn gas and stray light sprawling across 14,000 light-years with no shape to hold it.",
    modifier: {
      kind: "scale",
      magnitude: 0.15,
      label: "Chaotic sprawl — visible Scale ×1.15.",
    },
  },
  {
    id: "spiral",
    morphology: "spiral",
    morphologyName: "Spiral",
    names: [
      "Andromeda / M31",
      "Pinwheel / M101",
      "Triangulum / M33",
      "Whirlpool / M51",
      "Bode's Galaxy / M81",
      "Sunflower / M63",
    ],
    blurb:
      "A hundred billion suns wound into arms 100,000 light-years across. It does not know it is being wound tighter.",
    modifier: {
      kind: "production",
      magnitude: 0.15,
      label: "Sweeping arms churn matter — Energy production ×1.15.",
    },
  },
  {
    id: "barred-spiral",
    morphology: "barred-spiral",
    morphologyName: "Barred Spiral",
    names: [
      "Milky Way",
      "Southern Pinwheel / M83",
      "NGC 1300",
      "NGC 1365",
      "NGC 1672",
    ],
    blurb:
      "A central bar funnels gas inward to feed a core that will never be full. Yours is one of these — you have seen it from inside.",
    modifier: {
      kind: "channel",
      magnitude: 0.25,
      label: "The bar funnels inward — channel rate ×1.25.",
    },
  },
  {
    id: "lenticular",
    morphology: "lenticular",
    morphologyName: "Lenticular",
    names: [
      "Sombrero / M104",
      "Spindle / NGC 5866",
      "NGC 2787",
      "NGC 1023",
      "Cartwheel-adjacent / NGC 2685",
    ],
    blurb:
      "A disc that stopped forming stars an age ago — a smooth, spent thing, still bright, still turning in the dark.",
    modifier: {
      kind: "offline",
      magnitude: 0.3,
      label: "Quiescent and patient — offline efficiency +0.30.",
    },
  },
  {
    id: "elliptical",
    morphology: "elliptical",
    morphologyName: "Elliptical",
    names: [
      "M87",
      "Centaurus A / NGC 5128",
      "M49",
      "M60",
      "IC 1101",
      "Maffei 1",
    ],
    blurb:
      "A featureless swarm of a trillion ancient stars across a million light-years. Nothing new forms here. Nothing new needs to.",
    modifier: {
      kind: "negentropy",
      magnitude: 0.12,
      label: "Dense and old — ripeness (Negentropy) ×1.12.",
    },
  },
];

const archetypeById = new Map(galaxyArchetypes.map((a) => [a.id, a]));

/** Curated escalating order the target galaxy advances through each Consume. */
const advanceOrder: readonly string[] = [
  "dwarf",
  "irregular",
  "spiral",
  "barred-spiral",
  "lenticular",
  "elliptical",
];

/** The current run's target galaxy: which archetype + which real name. Persisted. */
export interface GalaxyState {
  archetypeId: string;
  name: string;
}

/** Look up an archetype, falling back to the starter so a bad id can't crash. */
export function getArchetype(id: string): GalaxyArchetype {
  return archetypeById.get(id) ?? galaxyArchetypes[0]!;
}

/** Pick a name from an archetype's pool, avoiding an immediate repeat. */
function pickName(archetypeId: string, avoidName?: string): string {
  const pool = getArchetype(archetypeId).names;
  let name = pool[Math.floor(Math.random() * pool.length)] ?? pool[0]!;
  if (avoidName !== undefined && pool.length > 1) {
    let guard = 0;
    while (name === avoidName && guard < 8) {
      name = pool[Math.floor(Math.random() * pool.length)] ?? pool[0]!;
      guard += 1;
    }
  }
  return name;
}

/** The starter galaxy a fresh save / migrated save begins with (a small dwarf). */
export function starterGalaxy(): GalaxyState {
  return { archetypeId: "dwarf", name: pickName("dwarf") };
}

/**
 * The next target galaxy after a Consume: advance one step along the curated
 * order (wrapping), and draw a fresh name (no immediate repeat within a pool).
 */
export function nextGalaxy(current: GalaxyState): GalaxyState {
  const idx = advanceOrder.indexOf(current.archetypeId);
  const nextId =
    advanceOrder[(idx + 1) % advanceOrder.length] ?? advanceOrder[0]!;
  const avoid = nextId === current.archetypeId ? current.name : undefined;
  return { archetypeId: nextId, name: pickName(nextId, avoid) };
}

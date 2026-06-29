// Universe Survey copy (Expansion E2, COMMAND_CONSOLE.md §Universe Survey).
// Per-era faux-scan flavor for the survey panel. Data only — the panel renders
// whichever entry matches the current era. Eerie register (Pillar P2: the horror
// lives in flavor). The █ blocks are deliberate "redacted" readout glitches.

import type { TierVisualKey } from "./tiers.ts";

export interface SurveyEntry {
  /** DOMINANT STRUCTURE readout. */
  structure: string;
  /** CLASSIFICATION line — clinical, then unsettling. */
  classification: string;
  /** Whether the classification should render as a "redacted" warning. */
  redacted?: boolean;
  /** LIFESIGN line — only present once something is alive to detect. */
  lifesign?: string;
}

export const surveyByEra: Record<TierVisualKey, SurveyEntry> = {
  "quantum-foam": {
    structure: "VACUUM FLUCTUATION FIELD",
    classification: "pre-geometric · no stable forms · [DATA SPARSE]",
  },
  particles: {
    structure: "PARTICLE PLASMA",
    classification: "first matter cooling · charge asymmetry noted",
  },
  atoms: {
    structure: "NEUTRAL ATOMIC GAS",
    classification: "electrons captured · medium gone transparent · light runs free",
  },
  molecules: {
    structure: "MOLECULAR CLOUD",
    classification: "bonds forming · chemistry viable · specimen warming",
  },
  nebulae: {
    structure: "EMISSION NEBULA",
    classification: "gas & dust pooling · gravitational seeds noted · [CRADLE]",
  },
  stars: {
    structure: "STELLAR NURSERY",
    classification: "fusion ignited · energy gradients steep · [PROMISING]",
  },
  galaxies: {
    structure: "SPIRAL DISC",
    classification: "stars coalescing into arms · rotation flattening the cloud · [STRUCTURE FORMING]",
  },
  clusters: {
    structure: "GLOBULAR CLUSTERS",
    classification: "ancient spheres orbiting the halo · pre-disc remnants · hundreds of thousands of suns each",
  },
  life: {
    structure: "BIOSPHERE",
    classification: "self-replication confirmed · DO NOT DISTURB",
    redacted: true,
    lifesign:
      "DETECTED — discrete minds present. they have named their sky. they have not named you.",
  },
  civilization: {
    structure: "ORGANIZED EMISSION GRID",
    classification: "nightside lattices · deliberate signal · they believe they are alone",
    lifesign:
      "DETECTED — minds at scale. they map their sky and miss its edge. they have not named you.",
  },
  unknown: {
    structure: "█████████ █████",
    classification: "CLASSIFICATION WITHHELD · the readout refuses",
    redacted: true,
    lifesign: "█████ — it is aware of the survey.",
  },
};

// Transient channel state (Expansion P1). Written by the UI hold gesture
// (ui/channel.ts), read by the render layer (universe.ts) to draw the inflow.
// Deliberately NOT in GameState — it's ephemeral interaction state, not save data.

export const channeling = {
  /** Whether the pointer is currently held on the channel zone. */
  active: false,
  /** Eased 0..1 ramp of the hold (spin-up / spin-down). */
  intensity: 0,
};

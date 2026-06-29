# Space ClickerZ — *the Attractor*

An eerie cosmic-horror **idle/incremental** browser game (Chromium, semi-3D).
You are **the Attractor**: grow a galaxy from a spark, cultivate matter →
stars → life (raising **Negentropy**), then **Consume** it for permanent
**Entropy** (prestige + leaderboard score). Calm, AFK-friendly; the horror lives
in flavor and visuals, never in punishing difficulty.

See `CLAUDE.md` and the four specs (`GAME_DESIGN`, `TECH_ARCHITECTURE`,
`VISUAL_SPEC`, `BALANCING`) for design intent.

## Stack

Vite + TypeScript (strict) · Three.js (+ EffectComposer/bloom, M5) ·
`break_infinity.js` for all currencies · vanilla DOM overlay for the HUD ·
localStorage persistence.

## Commands

```
npm install
npm run dev        # local dev server (Vite)
npm run build      # type-check + production build
npm run preview    # serve the production build
npm run typecheck  # tsc --noEmit
```

## Architecture (three decoupled systems)

`GameState` (single source of truth) ← read/write by **sim/** (fixed-timestep,
FPS-independent) · read-only by **render/** (Three.js) · **ui/** subscribes and
emits intents. Game logic lives **only** in `sim/`. All tunable content lives in
`src/data/`.

## Build status

- **M1 (Scaffold)** ✅ — runnable shell: blank canvas + DOM HUD, reactive store,
  data-driven config, fixed-timestep sim loop, localStorage save/load.
- **M2 (State + sim core)** ✅ — Energy taps, one idle generator with geometric
  cost + closed-form bulk buy, FPS-independent production, autosave + load.
  Verified end-to-end (tap → buy → idle accrual → persist → reload).
- **M3 (Core loop)** ✅ — Complexity tier ladder (buy/owned/locked) from
  `tiers.ts`, one generator per tier, derived **Scale** + **Negentropy** that
  grow as you climb. Playable: tap → buy generators → unlock tiers → watch the
  universe grow. Tier→fact-unlock wiring in place.
- **M4 (Prestige loop)** ✅ — **Consume → Entropy** (sqrt prestige + meta
  falloff), permanent Entropy upgrades that accelerate the next run,
  reset-to-Big-Bang, cycle counter. **MVP complete: a full
  grow → consume → upgrade → repeat loop.** Verified end-to-end.

- **M5 (Render)** ✅ — Three.js semi-3D scene: central universe (particle cloud +
  glowing core) that morphs per era, parallax starfields (3 layers), nebula haze,
  the Attractor as dark negative-space at the edge, slow auto-orbit camera +
  pointer parallax, and `UnrealBloom`. Bound to state; quality-scaled.

- **M6 (Consume FX)** ✅ — the signature devour animation: pull → collapse toward
  the Attractor → fade-to-black (prestige applied under cover) → a new smaller
  spark. The Attractor grows each cycle. Skippable after first viewing (setting).
  Save schema v2 + migration.

- **M7 (Content & juice)** ✅ — fact-unlock popups (tier/Scale/cycle-triggered),
  Scale comparison strings + slide-in popups, a live comparison line, a clickable
  re-readable cycle log (redacted until observed), and sound hooks (subtle WebAudio
  cues, off by default).

- **M8 (Offline progress)** ✅ — timestamp catch-up on load at 100% efficiency,
  capped at 12h, with an eerie "the Attractor was patient" AFK summary popup.

- **M9 (Settings & a11y)** ✅ — settings modal: quality (live scene rebuild),
  reduced-motion, number-format & sound toggles, skip-Consume-FX, instability
  (opt-in), export/import save, and a confirm-gated reset. Save schema v3.
- **M10 (Leaderboard)** ✅ — pluggable `Leaderboard` interface, local-only default
  that persists the best total Entropy; submitted on load/autosave/Consume; the
  standing surfaces in the cycle log. A networked impl can swap behind the interface.

**All 10 milestones complete.** Fully playable: grow → consume → upgrade → repeat,
with semi-3D visuals, the devour animation, content/juice, offline progress,
settings/a11y, and a local leaderboard.

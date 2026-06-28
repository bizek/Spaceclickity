# Space ClickerZ — *the Attractor*

An eerie cosmic-horror **idle/incremental** browser game (Chromium, semi-3D).
You are **the Attractor**: grow a universe from a spark, cultivate matter →
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

Milestone **1 (Scaffold)** complete — runnable shell: blank canvas + DOM HUD,
empty reactive store, data-driven config, fixed-timestep sim loop (no-op),
localStorage save/load. Milestones 2–10 per `CLAUDE.md` build order.

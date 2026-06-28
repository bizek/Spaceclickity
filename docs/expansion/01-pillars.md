# Phase 3 — Design Pillars (Expansion)

The expansion is measured against these. The first three are **inherited and non-negotiable**;
the last two are **new** and specific to this expansion.

---

## Inherited pillars (do not break)

**P1 — Calm, AFK-friendly, never punishing.**
The horror lives in flavor and visuals, never in difficulty. No timers you must hit, no decay,
no failure states, no APM. *This is the pillar the EVE/X4 inspiration most threatens, so it is the
one we guard hardest.* The designer explicitly chose "aesthetic & UI only" precisely to protect it.

**P2 — Cosmic-horror through flavor & visuals.**
The dread is in the writing (facts, the Attractor's patience) and the look (negative space, the one
"wrong" mauve accent). New copy and new panels carry the same restrained, ominous register.

**P3 — Sacred separation; content is data.**
`GameState` is the single source of truth: written only by `sim/`, read-only by `render/`, and
`ui/` emits intents. Anything we'll have 10+ of — nodes, panels — is **data**, not code.

---

## New pillars (this expansion)

**P4 — The HUD is a character: an ancient instrument.**
The interface should feel like operating a vast, old console wired into a cosmic entity — EVE/X4
density: many panels, live telemetry, holographic readouts, scanlines, corner brackets, monospace
data. The screen should *read as an instrument*, not a webpage. But **every panel earns its space**
— density is curated signal, never decoration noise.

**P5 — Breadth through data, not code.**
Adding a discipline node or a console panel is filling out a form (a `NodeDef` / `PanelDef`), not
writing a system. The renderers are generic; the content is tables. This is what makes a "massive"
expansion tractable for a solo dev.

---

## Anti-goals (things we will NOT do)

- **No active-management pressure.** EVE/X4's *gameplay loop* is explicitly not copied. We take the
  look, never the obligation to babysit.
- **No clutter for its own sake.** A panel full of numbers nobody reads fails P4. If a readout
  doesn't inform a decision or sell the mood, it doesn't ship.
- **No modal maze.** The console adds panels *in place* around the center; it does not bury the game
  under nested menus. At most one overlay (the tree / log) open at a time.
- **Never cover the center universe.** The WebGL scene is the star; the console frames it.
- **No perf regression.** The 60-FPS cap, pixel-ratio caps, and quality tiers from the post-M10 pass
  stay intact. Denser DOM must not starve the WebGL frame; reduced-motion and Low quality must
  visibly simplify the console.

---

## Master design rule (overrides conflicts)

> **If a feature would make the player feel they *must* be present, it is wrong.**
> Attention is *rewarded* (richer telemetry to watch, faster manual play), never *required*.

When any expansion decision conflicts with another, this rule and P1 win.

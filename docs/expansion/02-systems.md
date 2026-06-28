# Phase 4 — Systems (Expansion)

Two new systems, designed at the conceptual level. Both sit *on top of* the existing sim/render/ui
split without changing it. Detailed node/panel content lives in [`DISCIPLINES.md`](DISCIPLINES.md)
and [`COMMAND_CONSOLE.md`](COMMAND_CONSOLE.md); this doc defines purpose, boundaries, and wiring.

---

## System A — Disciplines (passive trees)

**Purpose.** Give the meta-game (Entropy) long-horizon goals and build identity. Right now Entropy
buys 3 flat upgrades; Disciplines turn that into five themed trees of permanent power and unlocks.

**What it is.** Five **Disciplines**, each a small **directed acyclic graph** of nodes (not one giant
web). A node has prerequisites (other node ids), an Entropy cost, and an effect drawn from the
shared vocabulary ([`03-vocabulary.md`](03-vocabulary.md)). Each tree ends in a **capstone**.

The five disciplines (rationale; full nodes in [`DISCIPLINES.md`](DISCIPLINES.md)):

| Discipline | Theme | Absorbs | Role |
|---|---|---|---|
| **Matter** | Production & economy | *Deepening Hunger*, *Entropic Erosion* | Faster, cheaper growth within a run. |
| **Hunger** (Gravitation) | Conversion & prestige | *Wider Maw* | Bigger Entropy per Consume; softens falloff. |
| **Time** | Offline & automation | — | The AFK-pillar tree: longer caps, auto-buy. |
| **Mind** (Memory) | QoL, reveal, console unlocks | — | Unlocks panels, bulk-buy, fact hints. |
| **Void** (Entropy) | Horror payoff | — | Expensive, late, cross-discipline multipliers. |

**Boundaries — what it is NOT.**
- It does **not** add active verbs. Nodes grant passive multipliers/unlocks read by `sim/` at derive
  time. Buying a node is the only interaction, and it's optional. (Guards P1.)
- It does **not** introduce a new currency. Nodes cost **Entropy** (designer's call).
- It does **not** own its effects' math — `sim/` interprets every effect, exactly like today's
  prestige upgrades.

**Connections.**
- **Entropy currency** ← node purchases deduct it.
- **`sim/disciplines.ts`** (new) ← aggregates node effects into multipliers; `production.ts`,
  `derive.ts`, `prestige.ts`, `offline.ts` read those aggregators (they already read the prestige
  aggregators — same pattern, generalized).
- **`ui/disciplinePanel.ts`** (new) ← renders each tree from data; SVG edges for prerequisites,
  buttons for nodes.
- **Migration** ← the 3 existing prestige upgrades become root nodes; save schema **v4**.

**Open questions.** Final node counts/costs are first-pass (see [`05-formulas.md`](05-formulas.md)).
Whether any node should be per-run/respec-able was considered and rejected for v1 (designer chose
permanent Entropy spend).

---

## System B — The Command Console (expanded UI)

**Purpose.** Deliver the EVE/X4 aesthetic (P4): reframe the restrained 3-column HUD as a dense,
multi-panel holographic instrument around the never-covered center.

**What it is.** Three layers:

1. **Dock layout** — replaces the rigid `grid-template-areas` with a denser dock of panels along the
   edges/corners. Center column stays clear for the WebGL universe.
2. **Panel framework** — a reusable `Panel` (title bar, collapse toggle, body slot, optional
   "lock/unlock" gate). Every readout becomes a uniform module. Panels are **data** (`PanelDef`):
   id, title, dock slot, unlock gate.
3. **Frame / chrome** — corner brackets, scanlines, faint grid, holographic tint, an animated boot
   sequence. Pure CSS/SVG; cheap; honors reduced-motion and quality.

**Panel inventory** (full spec in [`COMMAND_CONSOLE.md`](COMMAND_CONSOLE.md)):
existing panels restyled (Complexity ladder → "subsystem status," Readout, Cycle log, Consume,
Settings) **plus** new ones — **Telemetry** (live sparklines), **Universe Survey** (faux-scan of the
current era), and **Disciplines** (the trees, as a dockable overlay).

**Boundaries — what it is NOT.**
- It is **render/ui only**. It reads `GameState` and emits the same intents; it adds **no game
  logic**. (Guards P3.)
- It does **not** cover the center, does **not** open more than one overlay at a time, and does
  **not** regress the perf budget. (Guards P4 anti-goals.)
- Telemetry sampling is a UI-side ring buffer, never stored in `GameState`.

**Connections.**
- Reads the same derived values the HUD already binds (`deriveScale`, `deriveNegentropy`,
  `energyPerSecond`).
- Some panels are **gated by Mind-discipline unlock nodes** (`panelUnlock` effect) — the only place
  the two systems touch.
- Quality/reduced-motion settings drive chrome intensity and telemetry sample rate.

---

## How the two systems interact

Deliberately minimal, to keep them independently shippable:

- Mind nodes can **unlock console panels** (`panelUnlock`). That's the single coupling.
- The console's Disciplines panel is the **view** onto System A.

Everything else is orthogonal: you can ship E1–E2 (console) with no trees, and E3 (trees) with the
old HUD if needed. That independence is intentional (see the build order in
[`README.md`](README.md)).

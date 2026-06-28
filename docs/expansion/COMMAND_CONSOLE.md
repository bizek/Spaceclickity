# The Command Console — UI Spec (first pass)

The data + look that fills System B: the EVE/X4-flavored instrument that frames the never-covered
center. Pure render/ui — no game logic (P3). Honors reduced-motion and quality (P4 anti-goals).

---

## Layout

Replace the rigid 3×3 `grid-template-areas` with a denser **edge dock**. The center column stays
empty for the WebGL universe; panels stack along the edges and corners.

```
┌─────────────────────── TOP: Entropy · the Attractor · ⚙ ───────────────────────┐
│ ┌── LEFT ──┐                                                   ┌── RIGHT ──┐    │
│ │ SUBSYSTEMS│                                                  │  READOUT   │   │
│ │ (Complexity│            [ the universe — never covered ]     │  TELEMETRY │   │
│ │  ladder)  │                                                  │  SURVEY    │   │
│ │ DISCIPLINES│                                                 └────────────┘   │
│ │  launcher │                                                                   │
│ └──────────┘                                                                    │
│ ┌─ CYCLE LOG ─┐                                          ┌──── CONSUME ────┐    │
│ └─────────────┘            tap to channel               └──────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
            ▒ scanlines · corner brackets · faint grid (chrome layer) ▒
```

Every panel uses the shared `Panel` chrome: a title bar (label + collapse caret), a body slot, and
an optional locked state (greyed with the unlock hint when gated by a Mind node).

---

## Panel inventory (`data/panels.ts`)

| id | title | dock | source | gate |
|---|---|---|---|---|
| `entropy` | (top bar) | top | `state.entropy` | always |
| `subsystems` | SUBSYSTEMS | left | Complexity ladder (restyled with progress bars) | always |
| `disciplines` | DISCIPLINES | left (launcher → overlay) | System A trees | always |
| `readout` | READOUT | right | Scale / Energy / Energy/s / Negentropy + comparison | always |
| `telemetry` | TELEMETRY | right | UI ring buffer → sparklines | `mind.telemetry-array` |
| `survey` | UNIVERSE SURVEY | right | era / structure / lifesign faux-scan | `mind.deep-survey` |
| `cyclelog` | RECORDS | bottom-left | cycle log (restyled) | always |
| `consume` | CONSUME | bottom-right | the weighty prestige action | always |

`PanelDef` is data (id, title, dock, defaultOpen, unlockedBy). Collapsed state persists in
`panelState`.

---

## New panels in detail

### Telemetry (gated by `mind.telemetry-array`)
- A UI-side **ring buffer** samples Energy/s, Scale, Negentropy at a fixed cadence (≈2 Hz; slower on
  Low/reduced-motion). **Never** stored in `GameState`.
- Renders 2–3 **canvas sparklines** with min/max labels and a faint moving "scan" cursor.
- This is the densest EVE/X4 element — live graphs are what sell "you're operating an instrument."

### Universe Survey (gated by `mind.deep-survey`)
- Reads current era (`visualKey`), Scale, Negentropy, cycle. Renders a **faux-scan readout**:
  dominant structure ("STELLAR NURSERY DETECTED"), a redacted classification, and — once the Life
  tier is reached — a "LIFESIGN" line written in the game's eerie register.
- Pure flavor + mood; advances P2 (horror) and P4 (density) at once.

### Disciplines (always on; launcher → overlay)
- The view onto System A. A left-dock **launcher** button opens a full-width overlay (one overlay at
  a time, per the anti-goal) with a tab per discipline.
- Each tab draws the tree from `data/disciplines.ts`: **SVG edges** for prerequisites, **node
  buttons** colored by the discipline accent. Node states: owned / available / locked / unaffordable.
- Buying emits `store.update(s => buyNode(s, id))` — the only intent this system adds.

---

## Chrome layer (`ui/console/frame.ts`)

Sits above the canvas, below the panels, `pointer-events: none`. All pure CSS/SVG, all cheap:

- **Corner brackets** framing the viewport (the EVE "targeting" motif).
- **Scanlines** — a faint repeating-linear-gradient overlay; opacity scales with quality, off on Low.
- **Faint grid** — subtle dot/line grid behind panels for the "schematic" feel.
- **Holographic tint** — a barely-there accent vignette.
- **Boot sequence** (E6) — on load, panels "power on" in a brief staggered fade + a one-line
  type-on status. Skipped under reduced-motion and after first view (reuse the `seenConsumeFX`
  pattern: a `seenBoot` flag).

---

## Aesthetic tokens (extends `:root` in `style.css`)

Keep the existing palette; add console-specific variables so the look is centralized:

```css
--console-grid:    rgba(120,140,180,0.06);
--console-scan:    rgba(127,231,216,0.05);  /* teal scanline */
--console-bracket: rgba(127,231,216,0.35);
--panel-glow:      0 0 0 1px var(--panel-border), 0 0 24px rgba(0,0,0,0.4) inset;
--readout-live:    #9ef0e2;  /* slightly brighter for "live" sparkline ink */
```

Type stays monospace/tabular (already set). Labels keep the wide letter-spacing the HUD uses.

---

## Constraints (must hold)

- **Center never covered** — panels dock to edges; the overlay (Disciplines/log) is dismissible and
  single-instance.
- **Perf budget** — denser DOM must not drop the WebGL frame below the 60-FPS cap. Telemetry uses one
  `requestAnimationFrame`-throttled canvas draw, not per-sample reflow. Re-verify in E6 across Low/
  Medium/High and confirm no regression vs. the post-M10 numbers.
- **Reduced-motion / Low quality** — disable scanline animation, the scan cursor, and the boot
  sequence; drop telemetry sample rate. The console must still be fully usable, just static.
- **Accessibility** — every panel collapse and node button is a real `<button>` with an `aria-label`,
  matching the existing HUD's a11y posture.

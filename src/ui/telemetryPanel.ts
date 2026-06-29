// Telemetry panel (Expansion E2, COMMAND_CONSOLE.md §Telemetry).
// The densest "you are operating an instrument" element: live sparklines of
// Energy/s, Scale, Negentropy. Sampling is a UI-side ring buffer — NEVER stored
// in GameState. Values grow exponentially, so we plot log10 normalized to the
// window. Drawing is rAF-throttled; one canvas per metric.

import Decimal from "break_infinity.js";
import type { Store } from "../state/store.ts";
import type { GameState } from "../state/schema.ts";
import { format } from "../util/format.ts";
import { energyPerSecond } from "../sim/production.ts";
import { deriveNegentropy, deriveScale } from "../sim/derive.ts";

const MAX_SAMPLES = 120; // ~60s of history at 2 Hz
const LINE = "#9ef0e2"; // --readout-live
const GRID = "rgba(127,231,216,0.10)";

interface Metric {
  read: (s: GameState) => Decimal;
  buf: number[]; // log10 samples
  valueEl: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

export function mountTelemetryPanel(parent: HTMLElement, store: Store<GameState>): void {
  const wrap = document.createElement("div");
  wrap.className = "telemetry";
  parent.append(wrap);

  function makeMetric(label: string, read: (s: GameState) => Decimal): Metric {
    const block = document.createElement("div");
    block.className = "tele-block";

    const head = document.createElement("div");
    head.className = "tele-head";
    const lab = document.createElement("span");
    lab.className = "tele-label";
    lab.textContent = label;
    const val = document.createElement("span");
    val.className = "tele-value";
    head.append(lab, val);

    const canvas = document.createElement("canvas");
    canvas.className = "tele-spark";

    block.append(head, canvas);
    wrap.append(block);

    const ctx = canvas.getContext("2d");
    if (ctx === null) throw new Error("[telemetry] no 2D context");
    return { read, buf: [], valueEl: val, canvas, ctx };
  }

  const metrics: Metric[] = [
    makeMetric("Energy/s", (s) => energyPerSecond(s)),
    makeMetric("Scale", (s) => deriveScale(s)),
    makeMetric("Negentropy", (s) => deriveNegentropy(s)),
  ];

  // --- Sampling: read derived values on a fixed cadence, push log10. ---
  function sample(): void {
    const s = store.get() as GameState;
    for (const m of metrics) {
      const v = m.read(s);
      const log = v.lte(0) ? 0 : v.log10();
      m.buf.push(Number.isFinite(log) ? log : 0);
      if (m.buf.length > MAX_SAMPLES) m.buf.shift();
    }
    scheduleDraw();
  }

  // --- Drawing: rAF-throttled; redraws every metric's sparkline. ---
  let rafId = 0;
  function scheduleDraw(): void {
    if (rafId !== 0) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      for (const m of metrics) drawSpark(m);
    });
  }

  function drawSpark(m: Metric): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = m.canvas.clientWidth || 180;
    const cssH = m.canvas.clientHeight || 38;
    const w = Math.round(cssW * dpr);
    const h = Math.round(cssH * dpr);
    if (m.canvas.width !== w || m.canvas.height !== h) {
      m.canvas.width = w;
      m.canvas.height = h;
    }
    const ctx = m.ctx;
    ctx.clearRect(0, 0, w, h);

    // Faint baseline so an empty/flat graph still reads as an instrument.
    ctx.strokeStyle = GRID;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h - 0.5);
    ctx.lineTo(w, h - 0.5);
    ctx.stroke();

    const buf = m.buf;
    if (buf.length < 2) return;

    let min = Infinity;
    let max = -Infinity;
    for (const v of buf) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const range = max - min || 1;
    const pad = 4 * dpr;

    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.5 * dpr;
    ctx.lineJoin = "round";
    ctx.beginPath();
    let lastX = 0;
    let lastY = 0;
    for (let i = 0; i < buf.length; i++) {
      const val = buf[i] ?? min;
      const x = (i / (buf.length - 1)) * w;
      const y = h - pad - ((val - min) / range) * (h - 2 * pad);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      lastX = x;
      lastY = y;
    }
    ctx.stroke();

    // Glowing dot at the current sample (the "live" marker).
    ctx.fillStyle = LINE;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 2 * dpr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Headlines update on every state change (cheap); sparkline on the cadence.
  store.subscribe((state) => {
    const notation = state.settings.notation;
    for (const m of metrics) {
      m.valueEl.textContent = format(m.read(state as GameState), notation);
    }
  });

  // Slower cadence when motion/effort is dialed down (Pillar P4 anti-regression).
  const s0 = store.get();
  const periodMs = s0.settings.reducedMotion || s0.settings.quality === "low" ? 1000 : 500;
  sample(); // seed one point immediately
  setInterval(sample, periodMs);
  window.addEventListener("resize", scheduleDraw);
}

// Disciplines panel + tree overlay (Expansion E3, COMMAND_CONSOLE.md §Disciplines).
// A dock panel (Entropy + launcher) opens a modal overlay with a tab per
// discipline; each tree is rendered from data — SVG prerequisite edges and
// positioned node buttons. UI reads state & emits the buyNode intent only.

import {
  disciplines,
  type DisciplineDef,
  type NodeDef,
} from "../data/disciplines.ts";
import {
  buyNode,
  canBuyNode,
  isNodeMaxed,
  nodeCost,
  nodeLevel,
  prereqsMet,
} from "../sim/disciplines.ts";
import { audio } from "../services/audio.ts";
import { format } from "../util/format.ts";
import type { Store } from "../state/store.ts";
import type { GameState } from "../state/schema.ts";

// Layout geometry (px), in grid units from NodeDef.position.
const COL_W = 140;
const ROW_H = 96;
const NODE_W = 120;
const NODE_H = 60;
const PAD = 28;

const SVG_NS = "http://www.w3.org/2000/svg";

interface NodeEls {
  node: NodeDef;
  btn: HTMLButtonElement;
  cost: HTMLElement;
}

export function mountDisciplines(parent: HTMLElement, store: Store<GameState>): void {
  // --- Dock panel body: Entropy readout + launcher ---
  const summary = document.createElement("div");
  summary.className = "disc-summary";
  const entropyLine = document.createElement("div");
  entropyLine.className = "disc-entropy";
  const openBtn = document.createElement("button");
  openBtn.className = "disc-open";
  openBtn.textContent = "◇ OPEN DISCIPLINES";
  summary.append(entropyLine, openBtn);
  parent.append(summary);

  // --- Overlay ---
  const overlay = document.createElement("div");
  overlay.className = "disc-overlay";
  overlay.hidden = true;

  const modal = document.createElement("div");
  modal.className = "disc-modal";

  const head = document.createElement("div");
  head.className = "disc-head";
  const title = document.createElement("h2");
  title.className = "disc-title";
  title.textContent = "DISCIPLINES";
  const headEntropy = document.createElement("div");
  headEntropy.className = "disc-head-entropy";
  const closeBtn = document.createElement("button");
  closeBtn.className = "disc-close";
  closeBtn.textContent = "✕";
  closeBtn.setAttribute("aria-label", "Close disciplines");
  head.append(title, headEntropy, closeBtn);

  const tabs = document.createElement("div");
  tabs.className = "disc-tabs";

  const graph = document.createElement("div");
  graph.className = "disc-graph";

  const detail = document.createElement("div");
  detail.className = "disc-detail";

  modal.append(head, tabs, graph, detail);
  overlay.append(modal);
  document.body.append(overlay);

  // --- State ---
  let active: DisciplineDef = disciplines[0]!;
  let nodeEls: NodeEls[] = [];

  // Tab buttons.
  const tabButtons = new Map<string, HTMLButtonElement>();
  for (const d of disciplines) {
    const t = document.createElement("button");
    t.className = "disc-tab";
    t.textContent = d.name;
    t.addEventListener("click", () => {
      active = d;
      renderGraph();
      updateStates();
    });
    tabs.append(t);
    tabButtons.set(d.id, t);
  }

  function setDetail(node: NodeDef | null): void {
    if (node === null) {
      detail.innerHTML = "";
      const blurb = document.createElement("p");
      blurb.className = "disc-detail-blurb";
      blurb.textContent = active.blurb;
      detail.append(blurb);
      return;
    }
    const level = nodeLevel(store.get() as GameState, node.id);
    const notation = store.get().settings.notation;
    detail.innerHTML = "";
    const name = document.createElement("div");
    name.className = "disc-detail-name";
    name.textContent = node.name + (node.isCapstone === true ? "  ◆" : "");
    const desc = document.createElement("div");
    desc.className = "disc-detail-desc";
    desc.textContent = node.description;
    const meta = document.createElement("div");
    meta.className = "disc-detail-meta";
    if (isNodeMaxed(store.get() as GameState, node)) {
      meta.textContent = "OWNED";
    } else {
      const cost = nodeCost(node, level);
      const lvlTxt = node.leveled === true ? `Lv ${level} → ${level + 1} · ` : "";
      meta.textContent = `${lvlTxt}cost ${format(cost, notation)} Entropy`;
    }
    detail.append(name, desc, meta);
  }

  function renderGraph(): void {
    graph.innerHTML = "";
    graph.style.setProperty("--disc-accent", active.accent);
    nodeEls = [];

    let maxX = 0;
    let maxY = 0;
    for (const n of active.nodes) {
      maxX = Math.max(maxX, n.position.x);
      maxY = Math.max(maxY, n.position.y);
    }
    const w = PAD * 2 + maxX * COL_W + NODE_W;
    const h = PAD * 2 + maxY * ROW_H + NODE_H;
    graph.style.width = `${w}px`;
    graph.style.height = `${h}px`;

    // Edges behind nodes.
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "disc-edges");
    svg.setAttribute("width", String(w));
    svg.setAttribute("height", String(h));
    const center = (n: NodeDef): { x: number; y: number } => ({
      x: PAD + n.position.x * COL_W + NODE_W / 2,
      y: PAD + n.position.y * ROW_H + NODE_H / 2,
    });
    const byId = new Map(active.nodes.map((n) => [n.id, n]));
    for (const n of active.nodes) {
      for (const reqId of n.requires) {
        const req = byId.get(reqId);
        if (req === undefined) continue;
        const a = center(req);
        const b = center(n);
        const line = document.createElementNS(SVG_NS, "line");
        line.setAttribute("x1", String(a.x));
        line.setAttribute("y1", String(a.y));
        line.setAttribute("x2", String(b.x));
        line.setAttribute("y2", String(b.y));
        line.setAttribute("class", "disc-edge");
        line.dataset["from"] = reqId;
        svg.append(line);
      }
    }
    graph.append(svg);

    // Node buttons.
    for (const node of active.nodes) {
      const btn = document.createElement("button");
      btn.className = "disc-node";
      btn.style.left = `${PAD + node.position.x * COL_W}px`;
      btn.style.top = `${PAD + node.position.y * ROW_H}px`;
      if (node.isCapstone === true) btn.classList.add("is-capstone");

      const name = document.createElement("span");
      name.className = "disc-node-name";
      name.textContent = node.name;
      const cost = document.createElement("span");
      cost.className = "disc-node-cost";
      btn.append(name, cost);

      btn.addEventListener("click", () => {
        audio.cue("node");
        store.update((s) => void buyNode(s, node.id));
        setDetail(node);
      });
      btn.addEventListener("mouseenter", () => setDetail(node));
      btn.addEventListener("focus", () => setDetail(node));

      graph.append(btn);
      nodeEls.push({ node, btn, cost });
    }

    for (const [id, t] of tabButtons) t.classList.toggle("is-active", id === active.id);
    setDetail(null);
  }

  function updateStates(): void {
    const state = store.get() as GameState;
    const notation = state.settings.notation;
    entropyLine.textContent = `Entropy: ${format(state.entropy, notation)}`;
    headEntropy.textContent = `ENTROPY: ${format(state.entropy, notation)}`;

    for (const { node, btn, cost } of nodeEls) {
      const level = nodeLevel(state, node.id);
      const maxed = isNodeMaxed(state, node);
      const prereq = prereqsMet(state, node);
      const buyable = canBuyNode(state, node.id);

      btn.classList.toggle("is-owned", level > 0);
      btn.classList.toggle("is-locked", !prereq);
      btn.classList.toggle("is-available", buyable);
      btn.classList.toggle("is-unaffordable", prereq && !maxed && !buyable);
      btn.disabled = !buyable;

      if (maxed) {
        cost.textContent = "✓ owned";
      } else {
        const c = nodeCost(node, level);
        const prefix = node.leveled === true && level > 0 ? `Lv ${level} · ` : "";
        cost.textContent = `${prefix}${format(c, notation)}`;
      }
    }
  }

  // --- Open / close ---
  function open(): void {
    overlay.hidden = false;
    renderGraph();
    updateStates();
  }
  function close(): void {
    overlay.hidden = true;
  }
  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) close();
  });

  // Live updates: entropy line always; node states only while the overlay is open.
  store.subscribe((state) => {
    const notation = state.settings.notation;
    entropyLine.textContent = `Entropy: ${format(state.entropy, notation)}`;
    if (!overlay.hidden) updateStates();
  });
}

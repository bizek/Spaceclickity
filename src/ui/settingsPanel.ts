// Settings & accessibility panel (VISUAL_SPEC §8, CLAUDE.md §9).
// Quality, reduced-motion, number format, sound, skip-FX, instability (opt-in),
// export/import save, and reset. UI reads state & emits intents via the store.

import { defaultGameState, type GameState } from "../state/schema.ts";
import type { Store } from "../state/store.ts";
import { exportSave, importSave, saveGame, wipeSave } from "../util/save.ts";

type Quality = GameState["settings"]["quality"];

export function mountSettingsPanel(store: Store<GameState>): { open: () => void } {
  const root = document.createElement("div");
  root.className = "log-overlay";
  root.hidden = true;

  const panel = document.createElement("div");
  panel.className = "log-panel settings-panel";
  root.append(panel);
  document.body.append(root);

  const close = (): void => {
    root.hidden = true;
  };
  root.addEventListener("click", (e) => {
    if (e.target === root) close();
  });

  function setSetting<K extends keyof GameState["settings"]>(
    key: K,
    value: GameState["settings"][K],
  ): void {
    store.update((s) => {
      s.settings[key] = value;
    });
    saveGame(store.get() as GameState);
  }

  function render(): void {
    const s = store.get();
    panel.innerHTML = "";

    const header = document.createElement("div");
    header.className = "log-header";
    const h = document.createElement("h2");
    h.className = "hud-panel-title";
    h.textContent = "SETTINGS";
    const x = document.createElement("button");
    x.className = "popup-close";
    x.textContent = "×";
    x.addEventListener("click", close);
    header.append(h, x);
    panel.append(header);

    // Quality (Low/Med/High) — applied live by rebuilding the scene.
    panel.append(
      segmented<Quality>("Quality", s.settings.quality, [
        ["low", "Low"],
        ["medium", "Med"],
        ["high", "High"],
      ], (v) => setSetting("quality", v)),
    );

    // Number notation.
    panel.append(
      segmented("Number format", s.settings.notation, [
        ["suffix", "Suffix"],
        ["scientific", "Scientific"],
      ], (v) => setSetting("notation", v)),
    );

    // Toggles.
    panel.append(toggle("Reduced motion", s.settings.reducedMotion, (v) => setSetting("reducedMotion", v)));
    panel.append(toggle("Sound", s.settings.sound, (v) => setSetting("sound", v)));
    panel.append(toggle("Skip Consume animation", s.settings.skipConsumeFX, (v) => setSetting("skipConsumeFX", v)));
    panel.append(
      toggle("Instability (hard mode, opt-in)", s.settings.instability, (v) => setSetting("instability", v)),
    );

    // Save management.
    panel.append(divider());
    panel.append(exportRow());
    panel.append(importRow());
    panel.append(resetRow());
  }

  function exportRow(): HTMLElement {
    const wrap = settingRow("Export save");
    const area = document.createElement("textarea");
    area.className = "settings-textarea";
    area.readOnly = true;
    const btn = button("Copy save string", () => {
      area.value = exportSave(store.get() as GameState);
      area.select();
      void navigator.clipboard?.writeText(area.value).catch(() => {});
    });
    wrap.append(btn, area);
    return wrap;
  }

  function importRow(): HTMLElement {
    const wrap = settingRow("Import save");
    const area = document.createElement("textarea");
    area.className = "settings-textarea";
    area.placeholder = "Paste a save string, then Import…";
    const status = document.createElement("div");
    status.className = "settings-status";
    const btn = button("Import & reload", () => {
      try {
        const next = importSave(area.value.trim());
        saveGame(next);
        location.reload();
      } catch {
        status.textContent = "That save string could not be read.";
      }
    });
    wrap.append(btn, area, status);
    return wrap;
  }

  function resetRow(): HTMLElement {
    const wrap = settingRow("Reset");
    const status = document.createElement("div");
    status.className = "settings-status";
    let armed = false;
    const btn = button("Erase all progress", () => {
      if (!armed) {
        armed = true;
        btn.textContent = "Click again to confirm — this is permanent";
        status.textContent = "This wipes every cycle. It is not a Consume.";
        return;
      }
      wipeSave();
      store.replace(defaultGameState());
      location.reload();
    });
    btn.classList.add("settings-danger");
    wrap.append(btn, status);
    return wrap;
  }

  return {
    open() {
      render();
      root.hidden = false;
    },
  };
}

// --- small DOM helpers ---

function settingRow(label: string): HTMLElement {
  const row = document.createElement("div");
  row.className = "settings-row";
  const l = document.createElement("div");
  l.className = "settings-label";
  l.textContent = label;
  row.append(l);
  return row;
}

function segmented<T extends string>(
  label: string,
  value: T,
  options: Array<[T, string]>,
  onPick: (v: T) => void,
): HTMLElement {
  const row = settingRow(label);
  const group = document.createElement("div");
  group.className = "settings-segmented";
  for (const [val, text] of options) {
    const b = document.createElement("button");
    b.className = `seg ${val === value ? "is-active" : ""}`;
    b.textContent = text;
    b.addEventListener("click", () => {
      onPick(val);
      for (const child of group.children) {
        child.classList.toggle("is-active", child === b);
      }
    });
    group.append(b);
  }
  row.append(group);
  return row;
}

function toggle(label: string, value: boolean, onChange: (v: boolean) => void): HTMLElement {
  const row = settingRow(label);
  let current = value;
  const b = document.createElement("button");
  b.className = `seg ${current ? "is-active" : ""}`;
  b.setAttribute("role", "switch");
  b.setAttribute("aria-checked", String(current));
  b.textContent = current ? "On" : "Off";
  b.addEventListener("click", () => {
    current = !current;
    onChange(current);
    b.classList.toggle("is-active", current);
    b.setAttribute("aria-checked", String(current));
    b.textContent = current ? "On" : "Off";
  });
  row.append(b);
  return row;
}

function button(label: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement("button");
  b.className = "settings-button";
  b.textContent = label;
  b.addEventListener("click", onClick);
  return b;
}

function divider(): HTMLElement {
  const d = document.createElement("div");
  d.className = "settings-divider";
  return d;
}

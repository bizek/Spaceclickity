// Console panel framework (Expansion E1, COMMAND_CONSOLE.md).
// A reusable, collapsible module shell so every readout reads as an instrument
// panel. Pure presentation — owns no game state; collapse is a UI preference
// persisted to its own localStorage key (GameState stays sim-only until v4/E3).

const COLLAPSE_KEY = "console.panels.v1";

function loadCollapsed(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(COLLAPSE_KEY);
    return raw === null ? {} : (JSON.parse(raw) as Record<string, boolean>);
  } catch {
    return {};
  }
}

function saveCollapsed(map: Record<string, boolean>): void {
  try {
    localStorage.setItem(COLLAPSE_KEY, JSON.stringify(map));
  } catch {
    // Non-fatal: collapse state simply won't persist.
  }
}

export interface PanelOptions {
  /** Stable id (used to persist collapsed state). */
  id: string;
  /** Title bar label. */
  title: string;
  /** Whether the panel can be collapsed. Default true. */
  collapsible?: boolean;
}

export interface PanelHandle {
  /** The panel root <section>; append it to a dock. */
  root: HTMLElement;
  /** The content slot; mount panel content here. */
  body: HTMLElement;
}

/** Build a console panel. Caller appends `root` to a dock and fills `body`. */
export function createPanel(opts: PanelOptions): PanelHandle {
  const collapsible = opts.collapsible ?? true;
  const collapsedMap = loadCollapsed();
  const startCollapsed = collapsible && (collapsedMap[opts.id] ?? false);

  const root = document.createElement("section");
  root.className = "panel" + (startCollapsed ? " is-collapsed" : "");
  root.dataset["panel"] = opts.id;

  const bar = document.createElement("header");
  bar.className = "panel-bar";

  const titleBtn = document.createElement("button");
  titleBtn.className = "panel-title";
  titleBtn.type = "button";

  const caret = document.createElement("span");
  caret.className = "panel-caret";
  caret.setAttribute("aria-hidden", "true");

  const label = document.createElement("span");
  label.className = "panel-label";
  label.textContent = opts.title;

  titleBtn.append(caret, label);
  bar.append(titleBtn);

  const body = document.createElement("div");
  body.className = "panel-body";

  root.append(bar, body);

  if (collapsible) {
    const sync = (): void => {
      const collapsed = root.classList.contains("is-collapsed");
      titleBtn.setAttribute("aria-expanded", String(!collapsed));
      titleBtn.setAttribute(
        "aria-label",
        `${opts.title} panel — ${collapsed ? "expand" : "collapse"}`,
      );
    };
    titleBtn.addEventListener("click", () => {
      const collapsed = root.classList.toggle("is-collapsed");
      const map = loadCollapsed();
      map[opts.id] = collapsed;
      saveCollapsed(map);
      sync();
    });
    sync();
  } else {
    titleBtn.disabled = true;
    titleBtn.setAttribute("aria-label", `${opts.title} panel`);
  }

  return { root, body };
}

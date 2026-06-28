// Lightweight reactive store (TECH_ARCHITECTURE §1, default: hand-rolled).
// Single source of truth. UI subscribes; sim reads/writes; render reads only.
// Hard rule: only sim/ mutates currencies — UI & render emit intents instead.

export type Listener<T> = (state: Readonly<T>) => void;
export type Updater<T> = (state: T) => void;

export class Store<T> {
  private state: T;
  private listeners = new Set<Listener<T>>();

  constructor(initial: T) {
    this.state = initial;
  }

  /** Read-only snapshot. */
  get(): Readonly<T> {
    return this.state;
  }

  /**
   * Mutate the state in place via the updater, then notify subscribers.
   * Kept mutation-in-place (not immutable copies) so the high-frequency sim
   * tick stays cheap; subscribers must not retain references across ticks.
   */
  update(mutate: Updater<T>): void {
    mutate(this.state);
    this.emit();
  }

  /** Subscribe; returns an unsubscribe fn. Fires immediately with current state. */
  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  /** Swap the entire state (e.g. import save / reset) and notify subscribers. */
  replace(next: T): void {
    this.state = next;
    this.emit();
  }

  /** Notify all subscribers without mutating (e.g. after a batch tick). */
  emit(): void {
    for (const listener of this.listeners) listener(this.state);
  }
}

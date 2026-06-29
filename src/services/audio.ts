// Sound hooks (VISUAL_SPEC §6 audio direction). Abstracted behind a tiny cue
// API so the game has no audio asset dependency. Subtle WebAudio synth: low
// drones, sub-bass on Consume, sparse high glints on milestones.
//
// Disabled by default (respect the quiet tone); the settings toggle (M9) flips
// `setEnabled`. The AudioContext is created lazily on the first cue after a user
// gesture, to satisfy browser autoplay policies.

export type Cue = "tap" | "unlock" | "milestone" | "consume" | "panel" | "node";

class AudioService {
  private ctx: AudioContext | null = null;
  private enabled = false;

  setEnabled(on: boolean): void {
    this.enabled = on;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  cue(kind: Cue): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (ctx === null) return;
    switch (kind) {
      case "tap":
        this.blip(ctx, 320, 0.04, 0.05, "triangle");
        break;
      case "unlock":
        this.blip(ctx, 660, 0.18, 0.12, "sine");
        break;
      case "milestone":
        this.blip(ctx, 1320, 0.25, 0.1, "sine");
        break;
      case "consume":
        this.blip(ctx, 55, 1.2, 0.22, "sine"); // sub-bass swell
        break;
      case "panel":
        this.blip(ctx, 240, 0.05, 0.03, "triangle"); // subtle collapse/expand
        break;
      case "node":
        this.blip(ctx, 480, 0.06, 0.04, "triangle"); // subtle node purchase
        break;
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx !== null) return this.ctx;
    try {
      this.ctx = new AudioContext();
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  private blip(
    ctx: AudioContext,
    freq: number,
    dur: number,
    gainPeak: number,
    type: OscillatorType,
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(gainPeak, now + Math.min(0.04, dur * 0.3));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }
}

export const audio = new AudioService();

// Procedural sprite textures (no asset files needed). Soft radial gradients used
// for the core glow, particles, starfield points, and nebula haze.

import { CanvasTexture, type Texture } from "three";

function radialGradientTexture(
  stops: Array<[number, string]>,
  size = 128,
): Texture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx === null) throw new Error("2D context unavailable for texture");

  const r = size / 2;
  const grad = ctx.createRadialGradient(r, r, 0, r, r, r);
  for (const [offset, color] of stops) grad.addColorStop(offset, color);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  return new CanvasTexture(canvas);
}

/** Tight bright core falling off to transparent — for particles & star points. */
export function makeGlowTexture(): Texture {
  return radialGradientTexture([
    [0, "rgba(255,255,255,1)"],
    [0.2, "rgba(255,255,255,0.85)"],
    [0.5, "rgba(255,255,255,0.25)"],
    [1, "rgba(255,255,255,0)"],
  ]);
}

/** Opaque dark center fading to transparent — negative space for the Attractor. */
export function makeVoidTexture(): Texture {
  return radialGradientTexture(
    [
      [0, "rgba(2,2,6,1)"],
      [0.55, "rgba(2,2,6,0.92)"],
      [0.8, "rgba(4,3,10,0.5)"],
      [1, "rgba(4,3,10,0)"],
    ],
    256,
  );
}

/** Very soft, wide haze — for nebula sprites. */
export function makeHazeTexture(): Texture {
  return radialGradientTexture(
    [
      [0, "rgba(255,255,255,0.5)"],
      [0.4, "rgba(255,255,255,0.18)"],
      [1, "rgba(255,255,255,0)"],
    ],
    256,
  );
}

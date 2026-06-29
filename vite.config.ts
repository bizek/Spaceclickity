import { defineConfig } from "vite";

// Node's `process` global (this config runs under Node), typed inline so we don't
// need a full `@types/node` dependency just for the PORT fallback below.
declare const process: { env: Record<string, string | undefined> };

// Minimal config; Vite auto-detects index.html at root.
export default defineConfig({
  server: {
    port: process.env["PORT"] ? Number(process.env["PORT"]) : 5173,
    open: false,
  },
  build: {
    target: "es2022",
    sourcemap: true,
  },
});

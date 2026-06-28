import { defineConfig } from "vite";

// Minimal config; Vite auto-detects index.html at root.
export default defineConfig({
  server: {
    port: 5173,
    open: false,
  },
  build: {
    target: "es2022",
    sourcemap: true,
  },
});

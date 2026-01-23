import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      external: ['crypto'],
    }
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  define: {
    global: 'globalThis',
    'global.crypto': '{}',
    'global.crypto.getRandomValues': '(array) => { const nodeCrypto = require("crypto"); if (array.buffer && array.buffer instanceof ArrayBuffer) { const buffer = nodeCrypto.randomBytes(array.length); for (let i = 0; i < array.length; i++) { array[i] = buffer[i]; } return array; } for (let i = 0; i < array.length; i++) { array[i] = Math.floor(Math.random() * 256); } return array; }'
  },
  optimizeDeps: {
    include: ['buffer'],
  }
});

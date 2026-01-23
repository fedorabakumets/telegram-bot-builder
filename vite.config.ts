import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const cryptoPolyfill = {
    name: 'crypto-polyfill',
    enforce: 'pre',
    resolveId(id) {
        if (id === 'crypto') {
            return id;
        }
    },
    load(id) {
        if (id === 'crypto') {
            return `
        export const randomBytes = (length) => {
          const bytes = new Uint8Array(length);
          if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            crypto.getRandomValues(bytes);
          } else {
            for (let i = 0; i < length; i++) {
              bytes[i] = Math.floor(Math.random() * 256);
            }
          }
          return bytes;
        };
        export const getRandomValues = (array) => {
          if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            return crypto.getRandomValues(array);
          } else {
            for (let i = 0; i < array.length; i++) {
              array[i] = Math.floor(Math.random() * 256);
            }
            return array;
          }
        };
        export default { randomBytes, getRandomValues };
      `;
        }
    }
};

export default defineConfig(async () => {
    const cartographer = process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
        ? await import("@replit/vite-plugin-cartographer").then((m) => m.cartographer())
        : [];

    return {
        plugins: [
            react(),
            runtimeErrorOverlay(),
            cartographer,
            cryptoPolyfill
        ].flat(),
        resolve: {
            alias: {
                "@": path.resolve(import.meta.dirname, "client", "src"),
                "@shared": path.resolve(import.meta.dirname, "shared"),
                "@assets": path.resolve(import.meta.dirname, "attached_assets"),
            },
        },
        root: path.resolve(import.meta.dirname, "client"),
        build: {
            outDir: path.resolve(import.meta.dirname, "dist"),
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
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
        },
        optimizeDeps: {
            include: ['buffer'],
        },
    };
});
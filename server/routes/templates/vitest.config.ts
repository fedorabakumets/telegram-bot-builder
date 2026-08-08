/**
 * @fileoverview Конфигурация Vitest для тестов server/routes/templates
 * @module server/routes/templates/vitest.config
 */

import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: dir,
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}"],
    exclude: ["node_modules/**"],
  },
  resolve: {
    alias: {
      "@shared": path.resolve(dir, "../../../shared"),
    },
  },
});

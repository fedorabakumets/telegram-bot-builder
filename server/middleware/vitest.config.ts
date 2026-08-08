/**
 * @fileoverview Vitest для middleware bot-api-actor.
 * @module server/middleware/vitest.config
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
    include: ["**/*.{test,spec}.ts"],
  },
  resolve: {
    alias: {
      "@shared": path.resolve(dir, "../../shared"),
    },
  },
});

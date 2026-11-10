/**
 * @fileoverview Узкая конфигурация проверок получателей и статистики рассылок.
 */
import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  root: dir,
  test: { environment: "node", include: ["*.test.ts"] },
  resolve: { alias: { "@shared": path.resolve(dir, "../../../../../shared") } },
});

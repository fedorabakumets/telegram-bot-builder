/** @fileoverview Изолированная конфигурация проверки кэша настроек. */
import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  test: { environment: "node", include: ["server/services/app-settings-cache.test.ts"] },
  resolve: { alias: { "@shared": path.resolve(process.cwd(), "shared") } },
});

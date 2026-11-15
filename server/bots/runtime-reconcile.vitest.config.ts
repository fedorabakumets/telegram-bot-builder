/** @fileoverview Изолированная конфигурация проверок сверки удалённого исполнителя. */
import { defineConfig } from "vitest/config";
import path from "node:path";

/** Проверяются только сценарии восстановления намерений ботов. */
export default defineConfig({
  resolve: { alias: { "@shared": path.resolve("shared") } },
  test: { environment: "node", include: ["server/bots/runtime-reconcile.test.ts"] },
});

/** @fileoverview Изолированная конфигурация проверок сверки удалённого исполнителя. */
import { defineConfig } from "vitest/config";

/** Проверяются только сценарии восстановления намерений ботов. */
export default defineConfig({
  test: { environment: "node", include: ["server/bots/runtime-reconcile.test.ts"] },
});

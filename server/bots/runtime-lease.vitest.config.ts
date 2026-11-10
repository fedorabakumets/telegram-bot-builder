/** @fileoverview Изолированная конфигурация проверок аренды исполнителя. */
import { defineConfig } from "vitest/config";

/** Проверяются только операции аренды без внешнего Redis. */
export default defineConfig({
  test: { environment: "node", include: ["server/bots/runtime-lease.test.ts"] },
});

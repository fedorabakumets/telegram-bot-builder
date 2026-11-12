/** @fileoverview Отдельный локальный запуск сквозного теста общего Python без реальных ботов. */
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "node", include: ["server/runner/polling/sharedPython.integration.test.ts", "server/runner/polling/sharedUnlimited.integration.test.ts"], testTimeout: 60_000 } });

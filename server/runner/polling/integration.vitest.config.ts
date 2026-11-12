/** @fileoverview Отдельный запуск реального локального Redis и Python без пользовательских сервисов. */
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "node", include: ["server/runner/polling/nodePython.integration.test.ts", "server/runner/polling/runnerRouting.integration.test.ts"], testTimeout: 60_000 } });

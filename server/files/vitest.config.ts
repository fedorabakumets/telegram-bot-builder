/** @fileoverview Конфигурация адресных проверок подготовки окружения бота. */
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["server/files/telegramBotApiEnv.test.ts", "server/files/botEnv.test.ts", "server/files/prepareBotEnv.test.ts"], environment: "node" } });

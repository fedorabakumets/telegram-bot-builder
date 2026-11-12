/** @fileoverview Адресные проверки лёгкого polling без подключения к Telegram. */
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "node", include: ["server/runner/polling/receiver.test.ts"] } });

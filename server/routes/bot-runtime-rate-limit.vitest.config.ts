/** @fileoverview Изолированный запуск HTTP-проверок квот настроек бота. */
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: ['server/routes/bot-runtime-rate-limit.test.ts'] } });

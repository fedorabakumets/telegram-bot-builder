/** @fileoverview Изолированная проверка HTTP-цепочки без базы данных и настоящего Telegram. */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', include: ['lib/tests/project-telegram-chain.test.ts'], testTimeout: 30_000 },
});

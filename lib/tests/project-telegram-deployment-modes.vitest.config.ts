/** @fileoverview Сквозная проверка двух режимов размещения брокера без настоящего Telegram. */
import { defineConfig } from 'vitest/config';

export default defineConfig({ test: {
  environment: 'node', include: ['lib/tests/project-telegram-deployment-modes.test.ts'], testTimeout: 45_000,
} });

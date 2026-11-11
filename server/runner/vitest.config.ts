/** @fileoverview Адресные проверки защиты команд и границ зависимостей исполнителя ботов. */
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: [
  'server/runner/runnerCommandFence.test.ts', 'server/runner/runner-boundaries.test.ts',
] } });

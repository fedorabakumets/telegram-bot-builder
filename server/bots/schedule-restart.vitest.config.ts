/** @fileoverview Изолированная конфигурация проверок автоперезапуска ботов. */
import { defineConfig } from 'vitest/config';
import path from 'node:path';

/** Проверяется отмена запуска при явной остановке. */
export default defineConfig({
  resolve: { alias: { '@shared': path.resolve('shared') } },
  test: { environment: 'node', include: ['server/bots/scheduleBotRestart.test.ts'] },
});

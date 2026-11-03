/** @fileoverview Изолированная проверка реального хука конфликтов MCP без общих моков приложения. */
import { defineConfig } from 'vitest/config';
import path from 'node:path';
export default defineConfig({
  test: { environment: 'jsdom', include: ['lib/bot-tools/canvas-draft-conflict.test.ts'] },
  resolve: { alias: { '@': path.resolve('client'), '@shared': path.resolve('shared') } },
});

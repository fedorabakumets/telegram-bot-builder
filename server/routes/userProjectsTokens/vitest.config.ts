/** @fileoverview Изолированная конфигурация проверок маршрутов пользователей ботов. */
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: { environment: 'node', include: ['**/*.test.ts'], clearMocks: true },
  resolve: { alias: { '@shared': fileURLToPath(new URL('../../../shared', import.meta.url)) } },
});

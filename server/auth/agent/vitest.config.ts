/** @fileoverview Адресная проверка доверенной авторизации без полной проверки проекта. */
import { defineConfig } from 'vitest/config';
import path from 'node:path';
export default defineConfig({
  test: { environment: 'node', include: ['server/auth/agent/*.test.ts'] },
  resolve: { alias: { '@shared': path.resolve('shared') } },
});

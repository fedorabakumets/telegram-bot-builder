/** @fileoverview Адресная проверка ключа раннера и защиты пользовательского окружения. */
import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
export default defineConfig({ resolve: { alias: { '@shared': resolve(process.cwd(), 'shared') } }, test: { environment: 'node', include: [
  'server/bots/project-telegram-runner-auth.test.ts', 'server/files/legacy-session-candidates.test.ts',
  'server/bots/prepare-local-telegram-generation.test.ts',
  'lib/tests/project-telegram-accounts-http.test.ts',
] } });

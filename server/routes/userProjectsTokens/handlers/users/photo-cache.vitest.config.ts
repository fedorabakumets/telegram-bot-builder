/** @fileoverview Адресный запуск проверок кэша аватаров без приложения и базы данных. */
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: [
  'server/routes/userProjectsTokens/handlers/users/bot-user-photo-cache.test.ts',
] } });

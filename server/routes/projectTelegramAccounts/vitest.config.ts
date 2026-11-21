/** @fileoverview Адресная проверка HTTP-маршрутов Telegram-аккаунтов. */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', include: ['server/routes/projectTelegramAccounts/*.test.ts'] },
});

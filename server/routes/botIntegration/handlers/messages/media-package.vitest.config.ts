/** @fileoverview Изолированная проверка отправки пакета медиа без внешних сервисов. */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/routes/botIntegration/handlers/messages/*telegram-media-package.test.ts'],
  },
});

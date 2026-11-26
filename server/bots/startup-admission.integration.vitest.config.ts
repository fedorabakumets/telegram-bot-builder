/** @fileoverview Адресные интеграционные тесты допуска без Telegram, Python и базы данных. */
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node',
  include: ['server/bots/startup-admission.integration.test.ts'] } });

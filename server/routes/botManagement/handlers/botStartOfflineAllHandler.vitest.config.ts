/** @fileoverview Адресная конфигурация тестов массового запуска офлайн-ботов. */
import { defineConfig } from 'vitest/config';
import path from 'node:path';

/** Только обработчик массового запуска, без полной проверки проекта. */
export default defineConfig({ resolve: { alias: { '@shared': path.resolve('shared') } },
  test: { environment: 'node', include: ['server/routes/botManagement/handlers/botStartOfflineAllHandler.test.ts'] } });

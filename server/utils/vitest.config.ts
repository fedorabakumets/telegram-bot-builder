/** @fileoverview Конфигурация локальных тестов сетевых утилит и загрузок. */
import { defineConfig } from 'vitest/config';
import path from 'node:path';
export default defineConfig({ resolve: { alias: { '@shared': path.resolve('shared') } }, test: { include: ['server/utils/safe-external-request*.test.ts', 'server/routes/media/create-registered-upload.test.ts', 'server/routes/media/runtime-media-upload-route.test.ts', 'server/routes/media/upload-logical-url.test.ts', 'server/routes/media/incoming-photo-limit.test.ts'], environment: 'node' } });

/**
 * @fileoverview Локальная конфигурация Vitest для серверных тестов хранилища
 * (`server/storage`). Запускается в node-окружении (модули используют
 * `node:crypto` и `@aws-sdk/client-s3`), вне include-правил корневого конфига,
 * который покрывает только `client/**` и `lib/**`.
 * @module server/storage/tests/vitest.config
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  root: __dirname,
  test: {
    globals: true,
    environment: 'node',
    include: ['*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../../../shared'),
    },
  },
});

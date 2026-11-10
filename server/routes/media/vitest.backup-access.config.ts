/** @fileoverview Настройки тестов доступа к хранилищу бэкапов. */
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@shared': path.resolve('shared') } },
  test: { environment: 'node', include: ['server/routes/media/backup-upload-access.test.ts'] },
});

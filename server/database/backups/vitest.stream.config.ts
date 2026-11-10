/** @fileoverview Изолированные проверки потокового создания бэкапов без подключения к БД. */
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: ['server/database/backups/streamBackup.test.ts'] } });

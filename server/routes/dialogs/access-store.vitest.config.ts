/** @fileoverview Узкая проверка чтения сохранённых статусов доступа без подключения базы. */
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: ['server/routes/dialogs/access-store.test.ts'] } });

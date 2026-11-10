/** @fileoverview Узкая проверка локального PostgreSQL и безопасных ответов API. */
import { defineConfig } from 'vitest/config';

export default defineConfig({ test: { environment: 'node', include: [
  'server/database/pool-real.integration.test.ts',
  'server/middleware/api-error-handler.test.ts',
] } });

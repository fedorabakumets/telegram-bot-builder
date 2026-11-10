/** @fileoverview Изолированный запуск проверок жизненного цикла пула PostgreSQL. */
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: ['server/database/pool-resilience.test.ts'] } });

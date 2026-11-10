/** @fileoverview Изолированный запуск HTTP-регрессий CSRF без базы данных и браузера. */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', include: ['server/middleware/cookie-csrf.test.ts'] },
});

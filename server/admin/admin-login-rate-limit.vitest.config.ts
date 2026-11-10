/** @fileoverview Узкая конфигурация серверных тестов защиты административного входа. */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', include: ['server/admin/admin-login-rate-limit.test.ts'] },
});

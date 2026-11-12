/** @fileoverview Узкая конфигурация проверки лимитов административного рантайма. */
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { environment: 'node', include: ['server/admin/runtime-settings-rate-limit.test.ts'] },
});

/** @fileoverview Адресные проверки порядка закрытия незавершённого runtime. */
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: ['server/runner/runner-startup-cleanup.test.ts'] } });

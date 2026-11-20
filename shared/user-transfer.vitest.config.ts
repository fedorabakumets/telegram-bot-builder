/** @fileoverview Изолированная проверка общего формата переноса без полной проверки проекта. */
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: ['shared/user-transfer.test.ts'] } });

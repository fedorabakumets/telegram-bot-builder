/** @fileoverview Изолированные проверки разделённого HTTP-режима без запуска ботов и БД. */
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: ['server/runtime/*.test.ts'] } });

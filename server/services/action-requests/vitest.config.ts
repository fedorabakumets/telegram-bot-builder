/** @fileoverview Изолированная конфигурация тестов журнала без окружения приложения. */
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: ['server/services/action-requests/*.test.ts'] } });

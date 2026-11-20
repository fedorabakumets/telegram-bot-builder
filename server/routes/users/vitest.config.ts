/** @fileoverview Узкая проверка счётчиков страницы пользователей без запуска приложения. */
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: ['server/routes/users/*.test.ts'] } });

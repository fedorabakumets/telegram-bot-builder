/**
 * @fileoverview Конфигурация точечных проверок обработчиков токенов
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({ test: { environment: 'node', include: ['server/routes/userProjectsTokens/handlers/tokens/*.test.ts'] } });

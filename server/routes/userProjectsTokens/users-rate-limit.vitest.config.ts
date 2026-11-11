/** @fileoverview Узкий запуск серверных проверок квот пользователей ботов. */
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: ['server/routes/userProjectsTokens/users-rate-limit.test.ts'] } });

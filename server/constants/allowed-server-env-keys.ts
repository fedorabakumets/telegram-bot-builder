/**
 * @fileoverview Whitelist серверных переменных окружения для подстановки в env бота
 * @module server/constants/allowed-server-env-keys
 */

/**
 * Ключи process.env, которые можно подставлять в переменные бота как `${{KEY}}`.
 * Значения никогда не отдаются через API — только имена ключей (GET /api/server/env-keys).
 */
export const ALLOWED_SERVER_ENV_KEYS = [
  'DATABASE_URL',
  'REDIS_URL',
  'WEBHOOK_BASE_URL',
  'API_BASE_URL',
  'NODE_ENV',
  'PGHOST',
  'PGPORT',
  'PGDATABASE',
  'PGUSER',
] as const;

/** Тип имени разрешённой серверной переменной */
export type AllowedServerEnvKey = typeof ALLOWED_SERVER_ENV_KEYS[number];

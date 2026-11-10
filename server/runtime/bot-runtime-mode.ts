/**
 * @fileoverview Режим владения ботами для HTTP-сервера.
 * @module server/runtime/bot-runtime-mode
 */

/** Режим владения работающими ботами. */
export type BotRuntimeMode = 'combined' | 'api';

/**
 * Проверяет режим запуска HTTP-сервера.
 * @param value - Значение BOT_RUNTIME_MODE.
 * @returns Режим совместного запуска или отдельного API.
 */
export function resolveBotRuntimeMode(value = process.env.BOT_RUNTIME_MODE): BotRuntimeMode {
  if (!value || value === 'combined') return 'combined';
  if (value === 'api') return 'api';
  throw new Error('BOT_RUNTIME_MODE должен быть combined или api');
}

/**
 * Проверяет обязательные условия отдельного API до открытия порта.
 * @param mode - Выбранный режим владения ботами.
 * @param workerRuntime - Среда запуска воркеров.
 * @param redisUrl - Адрес Redis.
 * @param railwayProjects - Проекты с отдельными исполнителями Railway.
 * @returns Ничего.
 */
export function assertBotRuntimeMode(
  mode: BotRuntimeMode,
  workerRuntime: string,
  redisUrl: string | undefined,
  railwayProjects?: string,
): void {
  if (mode !== 'api') return;
  if (workerRuntime !== 'remote') {
    throw new Error('BOT_RUNTIME_MODE=api требует WORKER_RUNTIME=remote');
  }
  if (!redisUrl?.trim()) {
    throw new Error('BOT_RUNTIME_MODE=api требует REDIS_URL');
  }
  if (railwayProjects?.trim()) {
    throw new Error('BOT_RUNTIME_MODE=api пока не поддерживает WORKER_RAILWAY_PROJECTS');
  }
}

/** @fileoverview Явный ручной режим разработки без восстановления и автозапуска чужих ботов. */

/**
 * Проверяет локальный режим, не отключая восстановление production.
 * @param env - Окружение процесса API.
 * @returns Разрешены только явные ручные запуски.
 */
export function isManualDevBotStart(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV === 'development' && env.BOT_DEV_MANUAL_START === 'true';
}

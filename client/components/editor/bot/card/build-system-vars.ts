/**
 * @fileoverview Сборка системных переменных окружения бота
 * @module components/editor/bot/card/build-system-vars
 */

import type { BotToken } from '@shared/schema';

/** Элемент системной переменной */
export interface SystemVar {
  /** Имя переменной */
  key: string;
  /** Значение */
  value: string;
  /** Флаг секретности */
  isSecret: boolean;
  /** Значение подтянуто из серверного окружения (показывать как ссылку) */
  isServerRef: boolean;
}

/** Переменные, которые нельзя редактировать */
export const READ_ONLY_KEYS = new Set(['PROJECT_ID', 'TOKEN_ID']);

/**
 * Склонение подписи «N переменных»
 * @param count - Количество переменных
 * @returns Слово в нужной форме
 */
export function varsWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'переменная';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'переменные';
  return 'переменных';
}

/**
 * Формирует массив системных переменных из данных токена
 * @param token - Объект токена
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @param adminIds - ID администраторов
 * @param customItems - Кастомные переменные для переопределения дефолтов
 * @param serverEnvKeys - Ключи доступных серверных переменных
 * @returns Массив системных переменных
 */
export function buildSystemVars(token: BotToken, projectId: number, tokenId: number,
  adminIds: string, customItems: Array<{ key: string; value: string }>,
  serverEnvKeys: Set<string>): SystemVar[] {
  /** Маппинг кастомных переменных для переопределения дефолтов */
  const customMap = new Map(customItems.map(v => [v.key, v.value]));

  /** Резолвит значение и определяет источник */
  function resolve(key: string, defaultValue: string): { value: string; isServerRef: boolean } {
    if (customMap.has(key)) return { value: customMap.get(key)!, isServerRef: false };
    if (serverEnvKeys.has(key)) return { value: `\${{${key}}}`, isServerRef: true };
    return { value: defaultValue, isServerRef: false };
  }

  const apiBaseUrl = resolve('API_BASE_URL', 'http://localhost:5000');
  const apiPort = resolve('API_PORT', '5000');
  const apiUseSsl = resolve('API_USE_SSL', 'auto');
  const apiTimeout = resolve('API_TIMEOUT', '10');
  const disableAsyncLog = resolve('DISABLE_ASYNC_LOG', 'true');
  const redisUrl = resolve('REDIS_URL', 'redis://localhost:6379');
  const databaseUrl = resolve('DATABASE_URL', '');
  const maxUpdateAge = resolve('MAX_UPDATE_AGE_SECONDS', '300');
  const webhookPort = resolve('WEBHOOK_PORT', '8080');

  return [
    { key: 'BOT_TOKEN', value: token.token, isSecret: true, isServerRef: false },
    { key: 'ADMIN_IDS', value: adminIds || '123456789', isSecret: true, isServerRef: false },
    { key: 'PROJECT_ID', value: String(projectId), isSecret: false, isServerRef: false },
    { key: 'TOKEN_ID', value: String(tokenId), isSecret: false, isServerRef: false },
    { key: 'API_BASE_URL', value: apiBaseUrl.value, isSecret: false, isServerRef: apiBaseUrl.isServerRef },
    { key: 'API_PORT', value: apiPort.value, isSecret: false, isServerRef: apiPort.isServerRef },
    { key: 'API_USE_SSL', value: apiUseSsl.value, isSecret: false, isServerRef: apiUseSsl.isServerRef },
    { key: 'API_TIMEOUT', value: apiTimeout.value, isSecret: false, isServerRef: apiTimeout.isServerRef },
    { key: 'LOG_LEVEL', value: token.logLevel || 'WARNING', isSecret: false, isServerRef: false },
    { key: 'DISABLE_ASYNC_LOG', value: disableAsyncLog.value, isSecret: false, isServerRef: disableAsyncLog.isServerRef },
    { key: 'REDIS_URL', value: redisUrl.value, isSecret: true, isServerRef: redisUrl.isServerRef },
    { key: 'PROTECT_CONTENT', value: token.protectContent ? 'true' : 'false', isSecret: false, isServerRef: false },
    { key: 'SAVE_INCOMING_MEDIA', value: token.saveIncomingMedia ? 'true' : 'false', isSecret: false, isServerRef: false },
    { key: 'MESSAGES_RETENTION_DAYS', value: String(token.messagesRetentionDays ?? 0), isSecret: false, isServerRef: false },
    { key: 'DATABASE_URL', value: databaseUrl.value, isSecret: true, isServerRef: databaseUrl.isServerRef },
    { key: 'MAX_UPDATE_AGE_SECONDS', value: maxUpdateAge.value, isSecret: false, isServerRef: maxUpdateAge.isServerRef },
    { key: 'WEBHOOK_PORT', value: webhookPort.value, isSecret: false, isServerRef: webhookPort.isServerRef },
  ];
}

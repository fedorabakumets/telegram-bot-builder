/**
 * @fileoverview Проверка входных параметров и ответов API активности сообщений.
 */
import type { MessagesActivityPoint } from '../../shared/analytics/messages-activity.ts';
import { MESSAGES_ANALYTICS_PERIODS, type MessagesAnalyticsOptions } from './messages-analytics-types.ts';
import { validUsersCount, readUsersAnalytics } from './users-analytics-read.ts';

/**
 * Проверяет идентификаторы и режимы до обращения к API.
 * @param projectId - Идентификатор проекта.
 * @param options - Параметры выборки.
 * @returns Признак допустимых параметров.
 */
export function validMessagesOptions(projectId: number, options: MessagesAnalyticsOptions): boolean {
  return Number.isSafeInteger(projectId) && projectId > 0 &&
    (options.tokenId === undefined || (Number.isSafeInteger(options.tokenId) && options.tokenId > 0)) &&
    MESSAGES_ANALYTICS_PERIODS.includes(options.period ?? '30d') &&
    ['period', 'cumulative'].includes(options.mode ?? 'period') &&
    ['total', 'direction'].includes(options.split ?? 'total');
}

/**
 * Читает авторизованный API, сохраняя безопасную обработку ошибок HTTP.
 * @param path - Защищённый маршрут.
 * @param options - Адрес приложения.
 * @returns Необработанные данные.
 */
export function readMessagesAnalytics(path: string, options: MessagesAnalyticsOptions): Promise<unknown> {
  return readUsersAnalytics(path, { apiBaseUrl: options.apiBaseUrl });
}

/**
 * Проверяет ограниченный временной ряд и нормализует даты в UTC.
 * @param raw - Ответ API направлений.
 * @returns Отсортированные точки без посторонних полей.
 */
export function parseMessagesActivity(raw: unknown): MessagesActivityPoint[] {
  if (!Array.isArray(raw) || raw.length > 500) throw new Error('Некорректный ответ API аналитики');
  const dates = new Set<number>();
  return raw.map(point => {
    const timestamp = point && typeof point.date === 'string' ? Date.parse(point.date) : NaN;
    if (!Number.isFinite(timestamp) || dates.has(timestamp) ||
      !validUsersCount(point.incoming) || !validUsersCount(point.outgoing) ||
      !validUsersCount(point.incoming + point.outgoing)) throw new Error('Некорректный ответ API аналитики');
    dates.add(timestamp);
    return { date: new Date(timestamp).toISOString(), incoming: point.incoming, outgoing: point.outgoing };
  }).sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}

/**
 * Скрывает внутренние сетевые детали и тела ошибок API.
 * @param error - Ошибка загрузки или проверки.
 * @returns Безопасный ответ для MCP.
 */
export function messagesAnalyticsError(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  return { error: /^(Не удалось получить аналитику: HTTP \d{3}|Некорректн)/.test(message)
    ? message : 'Не удалось получить аналитику из API приложения' };
}

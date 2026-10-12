/**
 * @fileoverview Проверка и безопасное чтение данных API аналитики аудитории.
 */
import { apiFetch } from './api-fetch.ts';
import { USERS_ANALYTICS_PERIODS, type UsersAnalyticsOptions, type UsersSourcePoint } from './users-analytics-types.ts';
import type { UsersGrowthPoint } from '../../shared/analytics/users-growth.ts';

/**
 * Проверяет идентификаторы, период и режимы до обращения к API.
 * @param projectId - Идентификатор проекта
 * @param options - Параметры аналитики
 * @returns Признак допустимых параметров
 */
export function validUsersAnalyticsOptions(projectId: number, options: UsersAnalyticsOptions): boolean {
  return Number.isSafeInteger(projectId) && projectId > 0 &&
    (options.tokenId === undefined || (Number.isSafeInteger(options.tokenId) && options.tokenId > 0)) &&
    USERS_ANALYTICS_PERIODS.includes(options.period ?? '30d') &&
    ['period', 'cumulative'].includes(options.mode ?? 'period') &&
    ['total', 'source'].includes(options.groupBy ?? 'total');
}

/**
 * Читает JSON с передачей авторизации и скрывает тело ошибок HTTP.
 * @param path - Защищённый путь API
 * @param options - Адрес API и настройки выборки
 * @returns Необработанный ответ
 */
export async function readUsersAnalytics(path: string, options: UsersAnalyticsOptions): Promise<unknown> {
  const response = await apiFetch(path, { apiBaseUrl: options.apiBaseUrl });
  if (!response.ok) throw new Error(`Не удалось получить аналитику: HTTP ${response.status}`);
  return response.json();
}

/**
 * Проверяет число регистраций, не принимая строки и отрицательные значения.
 * @param value - Значение API
 * @returns Признак допустимого счётчика
 */
export function validUsersCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

/**
 * Проверяет даты и ограничивает объём временного ряда.
 * @param raw - Необработанные точки API
 * @returns Признак массива допустимых слотов
 */
function validDates(raw: unknown): raw is Array<Record<string, unknown> & { date: string }> {
  return Array.isArray(raw) && raw.length <= 500 && raw.every(point => point && typeof point === 'object' &&
    typeof point.date === 'string' && Number.isFinite(Date.parse(point.date)));
}

/**
 * Проверяет и сортирует общий временной ряд, отбрасывая посторонние поля.
 * @param raw - Необработанный ответ API
 * @returns Проверенные точки
 */
export function parseUsersGrowth(raw: unknown): UsersGrowthPoint[] {
  if (!validDates(raw) || raw.some(point => !validUsersCount(point.count))) throw new Error('Некорректный ответ API аналитики');
  return raw.map(point => ({ date: point.date, count: point.count as number }))
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}

/**
 * Проверяет источники и ограничивает ответ десятью тысячами значений.
 * @param raw - Необработанный ответ API
 * @returns Проверенные точки источников
 */
export function parseUsersSources(raw: unknown): UsersSourcePoint[] {
  if (!validDates(raw)) throw new Error('Некорректный ответ API аналитики');
  let values = 0;
  return raw.map(point => {
    const sources = point.sources;
    if (!sources || typeof sources !== 'object' || Array.isArray(sources)) throw new Error('Некорректный ответ API аналитики');
    const entries = Object.entries(sources);
    values += entries.length;
    if (values > 10000 || entries.some(([key, count]) => key.length > 1000 || !validUsersCount(count))) {
      throw new Error('Некорректный или слишком большой ответ API аналитики');
    }
    return { date: point.date, sources: Object.fromEntries(entries) as Record<string, number> };
  }).sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}

/** @fileoverview Проверка фильтров и ограниченных данных источников трафика. */
import { USERS_ANALYTICS_PERIODS, type UsersAnalyticsPeriod } from './users-analytics-types.ts';
import { validUsersCount, parseUsersSources } from './users-analytics-read.ts';

/** Фильтры карточек источников. */
export interface TrafficSourcesOptions {
  /** Окно прироста либо вся текущая аудитория для кольца. */
  period?: UsersAnalyticsPeriod | 'all';
  /** Один бот; без значения все боты проекта. */
  tokenId?: number;
  /** Число отдельных источников, остальные объединяются. */
  topLimit?: number;
  /** Адрес приложения для интеграций. */
  apiBaseUrl?: string;
}

/** Источник регистрации и его вклад. */
export interface TrafficSourceItem {
  /** Исходный параметр глубокой ссылки либо direct. */
  source: string;
  /** Число записей пользователей. */
  count: number;
  /** Доля от всех записей выбранной выборки в процентах. */
  percentage: number;
}

/**
 * Проверяет фильтры и запрещает all для динамики.
 * @param projectId - Проект.
 * @param options - Фильтры.
 * @param chart - Запрашивается ли временной ряд.
 * @returns Допустимы ли параметры.
 */
export function validTrafficSourcesOptions(projectId: number, options: TrafficSourcesOptions, chart: boolean): boolean {
  const period = options.period ?? '30d';
  return Number.isSafeInteger(projectId) && projectId > 0 &&
    (options.tokenId === undefined || (Number.isSafeInteger(options.tokenId) && options.tokenId > 0)) &&
    ((!chart && period === 'all') || USERS_ANALYTICS_PERIODS.includes(period as UsersAnalyticsPeriod)) &&
    Number.isInteger(options.topLimit ?? 10) && (options.topLimit ?? 10) >= 1 && (options.topLimit ?? 10) <= 20;
}

/**
 * Преобразует строго числовую строку PostgreSQL в счётчик.
 * @param value - Значение API.
 * @returns Проверенный счётчик.
 */
function countFromApi(value: unknown): number {
  const count = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  if (!validUsersCount(count)) throw new Error('Некорректный ответ API аналитики');
  return count;
}

/**
 * Проверяет источники всей аудитории, не раскрывая лишние поля API.
 * @param raw - Ответ API трафика.
 * @returns Карта количества записей по источникам.
 */
export function parseTrafficSources(raw: unknown): Map<string, number> {
  if (!raw || typeof raw !== 'object' || !('sources' in raw) || !Array.isArray(raw.sources) || raw.sources.length > 1000) {
    throw new Error('Некорректный или слишком большой ответ API аналитики');
  }
  const totals = new Map<string, number>();
  for (const item of raw.sources) {
    if (!item || typeof item.param !== 'string' || item.param.length > 256 || totals.has(item.param)) {
      throw new Error('Некорректный ответ API аналитики');
    }
    totals.set(item.param, countFromApi(item.count));
  }
  return totals;
}

/**
 * Проверяет временной ряд и запрещает дубли слотов и слишком длинные имена.
 * @param raw - Ответ API прироста по источникам.
 * @returns Проверенные точки с датами UTC.
 */
export function parseTrafficSourcesPoints(raw: unknown) {
  const points = parseUsersSources(raw);
  const dates = new Set<number>();
  for (const point of points) {
    const date = Date.parse(point.date);
    if (dates.has(date) || Object.keys(point.sources).some(name => name.length > 256)) {
      throw new Error('Некорректный ответ API аналитики');
    }
    dates.add(date);
    point.date = new Date(date).toISOString();
  }
  return points;
}

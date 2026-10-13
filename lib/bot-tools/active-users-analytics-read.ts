/**
 * @fileoverview Проверка параметров и данных API уникальных активных пользователей.
 */
import { USERS_ANALYTICS_PERIODS, type UsersAnalyticsPeriod } from './users-analytics-types.ts';
import { validUsersCount } from './users-analytics-read.ts';
import type { AnalyticsRangeOptions } from '../../shared/analytics/range.ts';

/** Параметры чтения активности пользователей. */
export interface ActiveUsersAnalyticsOptions extends AnalyticsRangeOptions {
  /** Готовое окно карточки; по умолчанию 30 дней. */
  period?: UsersAnalyticsPeriod;
  /** Один бот; отсутствие значения означает всех ботов проекта. */
  tokenId?: number;
  /** Общий ряд или новички и вернувшиеся. */
  split?: 'total' | 'cohort';
  /** Адрес API приложения. */
  apiBaseUrl?: string;
}

/** Проверенная точка активности. */
export interface ActiveUsersPoint {
  /** Начало слота в UTC. */
  date: string;
  /** Уникальные активные в слоте. */
  total: number;
  /** Активные с первым появлением в том же слоте. */
  newcomers: number;
  /** Остальные активные пользователи слота. */
  returning: number;
}

/**
 * Проверяет фильтры до отправки запроса.
 * @param projectId - Проект.
 * @param options - Фильтры.
 * @returns Допустимы ли параметры.
 */
export function validActiveUsersOptions(projectId: number, options: ActiveUsersAnalyticsOptions): boolean {
  return Number.isSafeInteger(projectId) && projectId > 0 &&
    (options.tokenId === undefined || (Number.isSafeInteger(options.tokenId) && options.tokenId > 0)) &&
    USERS_ANALYTICS_PERIODS.includes(options.period ?? '30d') &&
    ['total', 'cohort'].includes(options.split ?? 'total');
}

/**
 * Проверяет уникальные итоги и ограниченный ряд без суммирования по слотам.
 * @param raw - Необработанный ответ API.
 * @returns Нормализованные точки и уникальные итоги окна.
 */
export function parseActiveUsers(raw: unknown) {
  if (!raw || typeof raw !== 'object' || !('points' in raw) || !Array.isArray(raw.points) ||
    raw.points.length > 500 || !('activeInWindow' in raw) || !validUsersCount(raw.activeInWindow) ||
    !('newInWindow' in raw) || !validUsersCount(raw.newInWindow) || raw.newInWindow > raw.activeInWindow) {
    throw new Error('Некорректный ответ API аналитики');
  }
  const dates = new Set<number>();
  const points: ActiveUsersPoint[] = raw.points.map(point => {
    const timestamp = point && typeof point.date === 'string' ? Date.parse(point.date) : NaN;
    if (!Number.isFinite(timestamp) || dates.has(timestamp) ||
      !validUsersCount(point.total) || !validUsersCount(point.newcomers) || !validUsersCount(point.returning) ||
      point.newcomers + point.returning !== point.total) throw new Error('Некорректный ответ API аналитики');
    dates.add(timestamp);
    return { date: new Date(timestamp).toISOString(), total: point.total, newcomers: point.newcomers, returning: point.returning };
  });
  points.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  return { points, active: raw.activeInWindow, newcomers: raw.newInWindow };
}

/**
 * @fileoverview Контракты и ограничения аналитики аудитории через MCP.
 */

/** Допустимые периоды карточки аудитории. */
export const USERS_ANALYTICS_PERIODS = ['1h', '3h', '24h', '7d', '30d', '12w', '12m'] as const;
/** Период выборки аудитории. */
export type UsersAnalyticsPeriod = typeof USERS_ANALYTICS_PERIODS[number];

/** Параметры чтения сводки и графика. */
export interface UsersAnalyticsOptions {
  /** Готовое окно выборки; по умолчанию 30 дней. */
  period?: UsersAnalyticsPeriod;
  /** Токен одного бота; без значения учитываются все боты проекта. */
  tokenId?: number;
  /** Адрес API приложения для интеграций. */
  apiBaseUrl?: string;
  /** Значения слотов либо накопление. */
  mode?: 'period' | 'cumulative';
  /** Общая аудитория либо источники регистрации. */
  groupBy?: 'total' | 'source';
}

/** Точка прироста по источникам. */
export interface UsersSourcePoint {
  /** Начало слота в формате даты API. */
  date: string;
  /** Количество регистраций по источникам. */
  sources: Record<string, number>;
}

/** Соответствие окон и шагов существующему API. */
export const USERS_ANALYTICS_WINDOWS = {
  '1h': { granularity: '1m', step: '1 minute' },
  '3h': { granularity: '5m', step: '5 minutes' },
  '24h': { granularity: '1h', step: '1 hour' },
  '7d': { granularity: '1w', step: '1 day' },
  '30d': { granularity: '1d', step: '1 day' },
  '12w': { granularity: '7d', step: '1 week' },
  '12m': { granularity: '30d', step: '1 month' },
} as const;

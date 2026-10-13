/**
 * @fileoverview Контракты параметров и временных окон MCP-аналитики сообщений.
 */
import { USERS_ANALYTICS_PERIODS, USERS_ANALYTICS_WINDOWS, type UsersAnalyticsPeriod } from './users-analytics-types.ts';
import type { AnalyticsRangeOptions } from '../../shared/analytics/range.ts';

/** Допустимые периоды карточки активности сообщений. */
export const MESSAGES_ANALYTICS_PERIODS = USERS_ANALYTICS_PERIODS;
/** Соответствие периодов шагам существующего API. */
export const MESSAGES_ANALYTICS_WINDOWS = USERS_ANALYTICS_WINDOWS;

/** Параметры сводки и графика активности. */
export interface MessagesAnalyticsOptions extends AnalyticsRangeOptions {
  /** Готовый период, по умолчанию 30 дней. */
  period?: UsersAnalyticsPeriod;
  /** Один бот либо все боты проекта при отсутствии значения. */
  tokenId?: number;
  /** Базовый адрес авторизованного API приложения. */
  apiBaseUrl?: string;
  /** Обычные значения или накопление от нуля за период. */
  mode?: 'period' | 'cumulative';
  /** Все сообщения либо разбивка по направлениям. */
  split?: 'total' | 'direction';
}

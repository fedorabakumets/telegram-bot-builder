/**
 * @fileoverview Сводка и графики активности сообщений с общими для интерфейса расчётами.
 */
import { calculateCumulativeMessages, getMessagesActivitySeries, getMessagesActivitySummary } from '../../shared/analytics/messages-activity.ts';
import { MESSAGES_ANALYTICS_WINDOWS, type MessagesAnalyticsOptions } from './messages-analytics-types.ts';
import { messagesAnalyticsError, parseMessagesActivity, readMessagesAnalytics, validMessagesOptions } from './messages-analytics-read.ts';
import { validUsersCount } from './users-analytics-read.ts';
import { getExactCardAnalytics } from './analytics-range-db.ts';

/**
 * Загружает сохранённые счётчики и активность через маршруты с проверкой доступа.
 * @param projectId - Идентификатор проекта.
 * @param options - Фильтры окна и бота.
 * @returns Проверенные точки и сводка с описанием источников данных.
 */
async function loadMessagesAnalytics(projectId: number, options: MessagesAnalyticsOptions) {
  const period = options.period ?? '30d';
  const window = MESSAGES_ANALYTICS_WINDOWS[period];
  const tokenQuery = new URLSearchParams();
  if (options.tokenId !== undefined) tokenQuery.set('tokenId', String(options.tokenId));
  const activityQuery = new URLSearchParams(tokenQuery);
  activityQuery.set('granularity', window.granularity);
  activityQuery.set('split', 'true');
  const [stats, raw] = await Promise.all([
    readMessagesAnalytics(`/api/projects/${projectId}/users/stats?${tokenQuery}`, options),
    readMessagesAnalytics(`/api/projects/${projectId}/messages/activity?${activityQuery}`, options),
  ]);
  if (!stats || typeof stats !== 'object' || !('totalUsers' in stats) || !('totalInteractions' in stats) ||
    !validUsersCount(stats.totalUsers) || !validUsersCount(stats.totalInteractions)) {
    throw new Error('Некорректный ответ API аналитики');
  }
  const points = parseMessagesActivity(raw);
  const counts = getMessagesActivitySummary(points, stats.totalInteractions, stats.totalUsers);
  if (![counts.periodMessages, counts.incomingMessages, counts.outgoingMessages].every(validUsersCount)) {
    throw new Error('Некорректная сумма сообщений API');
  }
  /** Двенадцать недель имеют одинаковую длительность во всех карточках. */
  const windowDays = ({ '7d': 7, '30d': 30, '12w': 84, '12m': 365 } as Partial<Record<string, number>>)[period] ?? null;
  return { points, summary: {
    project_id: projectId, token_id: options.tokenId ?? null, period, ...window, window_days: windowDays,
    from: points[0]?.date ?? null, to: points.at(-1)?.date ?? null,
    total_messages: counts.totalMessages, period_messages: counts.periodMessages,
    incoming_messages: counts.incomingMessages, outgoing_messages: counts.outgoingMessages,
    total_users: stats.totalUsers, average_per_user: counts.averagePerUser,
    average_denominator: 'current_bot_users', average_scope: 'retained_messages',
    timestamp_timezone: 'UTC', bucket_timezone: 'UTC',
    activity_source: windowDays === null ? 'bot_messages' : 'message_activity_daily',
    metric_description: 'total_messages — сейчас сохранённые сообщения, не итог за всё время. incoming — тип user; outgoing — все остальные типы. total_users — записи bot_users, один человек у разных ботов учитывается повторно. average_per_user = total_messages / total_users, при нулевом знаменателе 0.',
    retention_description: 'Очистка истории уменьшает total_messages и короткие ряды 1h/3h/24h. Длинные ряды берутся из дневных агрегатов и сохраняются после очистки; period_messages может превышать total_messages. Данные до начала ведения агрегатов могут отсутствовать.',
    range_description: 'from/to — начала первого и последнего слотов API, не точные границы фильтра. Окно 12w — 84 дня; 12m — 365 дней. Группировка выполняется в UTC.',
  } };
}

/**
 * Возвращает сводку выбранного периода отдельно от сохранённой истории.
 * @param projectId - Идентификатор проекта.
 * @param options - Период, бот и адрес приложения.
 * @returns Сводка либо безопасная ошибка.
 */
export async function getMessagesSummaryInDb(projectId: number, options: MessagesAnalyticsOptions = {}) {
  if (!validMessagesOptions(projectId, options)) return { error: 'Некорректные параметры аналитики' };
  if (options.from !== undefined || options.to !== undefined || options.step !== undefined) return getExactCardAnalytics(projectId, 'messages', options, false);
  try { return (await loadMessagesAnalytics(projectId, options)).summary; }
  catch (error) { return messagesAnalyticsError(error); }
}

/**
 * Возвращает ограниченный график с накоплением только внутри выбранного периода.
 * @param projectId - Идентификатор проекта.
 * @param options - Фильтры, режим накопления и разбивка.
 * @returns Точки графика и сводка либо безопасная ошибка.
 */
export async function getMessagesChartInDb(projectId: number, options: MessagesAnalyticsOptions = {}) {
  if (!validMessagesOptions(projectId, options)) return { error: 'Некорректные параметры аналитики' };
  if (options.from !== undefined || options.to !== undefined || options.step !== undefined) return getExactCardAnalytics(projectId, 'messages', options, true);
  try {
    const data = await loadMessagesAnalytics(projectId, options);
    const mode = options.mode ?? 'period';
    const split = options.split ?? 'total';
    const directions = mode === 'cumulative' ? calculateCumulativeMessages(data.points) : data.points;
    const points = split === 'direction' ? directions : getMessagesActivitySeries(directions).totalPoints;
    return { ...data.summary, mode, split, points,
      accumulation_scope: mode === 'cumulative' ? 'selected_period' : null,
      chart_description: 'Обычный режим показывает сообщения по слотам. Накопительный режим начинается с нуля внутри выбранного окна; в пустых слотах переносится предыдущий итог. Это не накопление за всё время.',
    };
  } catch (error) { return messagesAnalyticsError(error); }
}

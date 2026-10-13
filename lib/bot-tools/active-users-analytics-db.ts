/**
 * @fileoverview Сводка и график уникальных активных пользователей через существующий API.
 */
import { USERS_ANALYTICS_WINDOWS } from './users-analytics-types.ts';
import { readUsersAnalytics } from './users-analytics-read.ts';
import { messagesAnalyticsError } from './messages-analytics-read.ts';
import { parseActiveUsers, validActiveUsersOptions, type ActiveUsersAnalyticsOptions } from './active-users-analytics-read.ts';

/**
 * Читает уникальные итоги и ряды с проверкой доступа на стороне API.
 * @param projectId - Проект.
 * @param options - Фильтры и адрес API.
 * @returns Точки и сводка с точным описанием подсчёта.
 */
async function loadActiveUsers(projectId: number, options: ActiveUsersAnalyticsOptions) {
  const period = options.period ?? '30d';
  const window = USERS_ANALYTICS_WINDOWS[period];
  const query = new URLSearchParams({ granularity: window.granularity });
  if (options.tokenId !== undefined) query.set('tokenId', String(options.tokenId));
  const data = parseActiveUsers(await readUsersAnalytics(`/api/projects/${projectId}/users/activity?${query}`,
    { apiBaseUrl: options.apiBaseUrl }));
  const windowDays = ({ '7d': 7, '30d': 30, '12w': 91, '12m': 365 } as Record<string, number>)[period] ?? null;
  return { points: data.points, summary: {
    project_id: projectId, token_id: options.tokenId ?? null, period, ...window, window_days: windowDays,
    active_users: data.active, newcomers: data.newcomers, returning: data.active - data.newcomers,
    from: data.points[0]?.date ?? null, to: data.points.at(-1)?.date ?? null,
    timestamp_timezone: 'UTC', bucket_timezone: 'UTC',
    activity_source: windowDays === null ? 'bot_messages' : 'user_activity_daily',
    metric_description: 'Уникальные user_id, отправившие входящие сообщения. При выборе всех ботов один человек учитывается один раз в окне и один раз в каждом слоте. Итоги окна берутся из API, а не из суммы точек.',
    cohort_description: 'Новички окна — активные с первым появлением внутри окна. Новички слота — активные с первым появлением в том же слоте; в последующих слотах они могут быть вернувшимися. При нескольких ботах сервер проверяет первое появление по записям этих ботов. Без профиля короткий ряд использует дату сообщения, дневная отметка — время её создания.',
    retention_description: 'Короткие окна используют сохранённые входящие сообщения и зависят от очистки истории. Длинные окна используют дневные отметки активности, сохраняющиеся после очистки сообщений. Данные до начала ведения отметок могут отсутствовать.',
    range_description: 'from/to — начала первого и последнего слотов, не точные границы фильтра. Длинные окна включают пограничный календарный день; 12w — 91 день, 12m — 365 дней как в UI.',
    aggregation_description: 'Точки нельзя суммировать или накапливать для подсчёта уникальных людей: один человек может присутствовать в нескольких слотах.',
  } };
}

/**
 * Возвращает уникальных активных, новичков и вернувшихся за окно.
 * @param projectId - Проект.
 * @param options - Период и бот.
 * @returns Сводка либо безопасная ошибка.
 */
export async function getActiveUsersSummaryInDb(projectId: number, options: ActiveUsersAnalyticsOptions = {}) {
  if (!validActiveUsersOptions(projectId, options)) return { error: 'Некорректные параметры аналитики' };
  try { return (await loadActiveUsers(projectId, options)).summary; }
  catch (error) { return messagesAnalyticsError(error); }
}

/**
 * Возвращает общий ряд или разбивку на новичков и вернувшихся без накопления.
 * @param projectId - Проект.
 * @param options - Период, бот и разбивка.
 * @returns Точки и уникальные итоги либо безопасная ошибка.
 */
export async function getActiveUsersChartInDb(projectId: number, options: ActiveUsersAnalyticsOptions = {}) {
  if (!validActiveUsersOptions(projectId, options)) return { error: 'Некорректные параметры аналитики' };
  try {
    const data = await loadActiveUsers(projectId, options);
    const split = options.split ?? 'total';
    return { ...data.summary, split, points: split === 'cohort' ? data.points
      : data.points.map(point => ({ date: point.date, count: point.total })) };
  } catch (error) { return messagesAnalyticsError(error); }
}

/**
 * @fileoverview Сводка и графики аудитории с расчётами, общими для UI и MCP.
 */
import { calculateCumulativeGrowth, getUsersGrowthSummary } from '../../shared/analytics/users-growth.ts';
import { getExactCardAnalytics } from './analytics-range-db.ts';
import { USERS_ANALYTICS_WINDOWS, type UsersAnalyticsOptions, type UsersSourcePoint } from './users-analytics-types.ts';
import { parseUsersGrowth, parseUsersSources, readUsersAnalytics, validUsersAnalyticsOptions, validUsersCount } from './users-analytics-read.ts';

/** Поля снимка аудитории: имя в API и имя для агента. */
const AUDIENCE_FIELDS = [
  ['privateUsers', 'private_users'],
  ['groupUsers', 'group_users'],
  ['channelUsers', 'channel_users'],
  ['usersInSeveralPlaces', 'users_in_several_places'],
  ['blockedBotUsers', 'blocked_bot_users'],
  ['deletedUsers', 'deleted_users'],
] as const;

/** Пояснение, что числа — люди по сообщениям, а не чаты карточки «Группы». */
const PLACES_DESCRIPTION = 'Люди по сохранённым сообщениям, не число чатов. private_users — личный чат, group_users — группа или супергруппа, channel_users — канал, users_in_several_places — сразу два или три вида. blocked_bot_users — is_blocked, deleted_users — is_deleted. Без token_id один человек у двух ботов считается дважды.';

/**
 * Оставляет текущие числа мест, блокировки и удалённых.
 * @param stats - Ответ /users/stats
 * @returns Снимок для сводки
 */
function audienceSnapshot(stats: object): Record<string, number | string> {
  const row = stats as Record<string, unknown>;
  const snapshot: Record<string, number | string> = { places_description: PLACES_DESCRIPTION };
  for (const [source, target] of AUDIENCE_FIELDS) {
    const value = row[source];
    if (!validUsersCount(value)) throw new Error('Некорректный ответ API аналитики');
    snapshot[target] = value;
  }
  return snapshot;
}

/**
 * Загружает исходные данные с проверкой доступа существующими маршрутами API.
 * @param projectId - Идентификатор проекта
 * @param options - Параметры окна и бота
 * @returns Сводка и исходные точки
 */
async function loadUsersAnalytics(projectId: number, options: UsersAnalyticsOptions) {
  const period = options.period ?? '30d';
  const window = USERS_ANALYTICS_WINDOWS[period];
  const tokenQuery = new URLSearchParams();
  if (options.tokenId !== undefined) tokenQuery.set('tokenId', String(options.tokenId));
  const growthQuery = new URLSearchParams(tokenQuery);
  growthQuery.set('granularity', window.granularity);
  const base = `/api/projects/${projectId}/users`;
  const [stats, growth] = await Promise.all([
    readUsersAnalytics(`${base}/stats?${tokenQuery}`, options),
    readUsersAnalytics(`${base}/growth?${growthQuery}`, options),
  ]);
  if (!stats || typeof stats !== 'object' || !('totalUsers' in stats) || !validUsersCount(stats.totalUsers)) {
    throw new Error('Некорректный ответ API аналитики');
  }
  const points = parseUsersGrowth(growth);
  const summary = getUsersGrowthSummary(points, stats.totalUsers);
  if (!validUsersCount(summary.newUsers)) throw new Error('Некорректная сумма прироста API');
  return { points, base, growthQuery, snapshot: audienceSnapshot(stats), summary: {
    project_id: projectId, token_id: options.tokenId ?? null, period, ...window,
    from: points[0]?.date ?? null, to: points.at(-1)?.date ?? null,
    total_users: summary.totalUsers, new_users: summary.newUsers, initial_users: summary.initialUsers,
    timestamp_timezone: 'UTC', bucket_timezone: 'UTC',
    metric_description: 'Количество записей bot_users. Один человек у разных ботов учитывается несколько раз.',
    range_description: 'from/to — начало первого и последнего слота API, а не точные границы фильтра. Окно 12m равно 365 дням; SQL группирует даты в UTC согласно настройке сессии БД.',
  } };
}

/**
 * Возвращает безопасную ошибку без деталей сети и внутренних ответов API.
 * @param error - Ошибка чтения или проверки данных
 * @returns Сообщение для клиента MCP
 */
function analyticsError(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  return { error: /^(Не удалось получить аналитику: HTTP \d{3}|Некорректн)/.test(message)
    ? message : 'Не удалось получить аналитику из API приложения' };
}

/**
 * Получает общий размер аудитории и регистрации за выбранное окно.
 * @param projectId - Идентификатор проекта
 * @param options - Фильтр бота и период
 * @returns Сводка либо безопасная ошибка
 */
export async function getUsersSummaryInDb(projectId: number, options: UsersAnalyticsOptions = {}) {
  if (!validUsersAnalyticsOptions(projectId, options)) return { error: 'Некорректные параметры аналитики' };
  if (options.from !== undefined || options.to !== undefined || options.step !== undefined) return getExactCardAnalytics(projectId, 'registrations', options, false);
  try {
    const loaded = await loadUsersAnalytics(projectId, options);
    return { ...loaded.summary, ...loaded.snapshot };
  }
  catch (error) { return analyticsError(error); }
}

/**
 * Накапливает регистрации по источникам только внутри выбранного периода.
 * @param points - Проверенные отсортированные точки источников
 * @returns Точки с переносом предыдущих значений на пропусках
 */
function accumulateSources(points: UsersSourcePoint[]): UsersSourcePoint[] {
  const totals = new Map<string, number>();
  let outputValues = 0;
  return points.map(point => {
    for (const [source, count] of Object.entries(point.sources)) {
      const total = (totals.get(source) ?? 0) + count;
      if (!validUsersCount(total)) throw new Error('Некорректная сумма прироста API');
      totals.set(source, total);
    }
    outputValues += totals.size;
    if (outputValues > 10000) throw new Error('Некорректный или слишком большой ответ API аналитики');
    return { date: point.date, sources: Object.fromEntries(totals) };
  });
}

/**
 * Получает обычный или накопительный график общей аудитории либо источников.
 * @param projectId - Идентификатор проекта
 * @param options - Период, бот, режим и группировка
 * @returns Точки графика и описание метрик либо безопасная ошибка
 */
export async function getUsersChartInDb(projectId: number, options: UsersAnalyticsOptions = {}) {
  if (!validUsersAnalyticsOptions(projectId, options)) return { error: 'Некорректные параметры аналитики' };
  if (options.from !== undefined || options.to !== undefined || options.step !== undefined) return getExactCardAnalytics(projectId, 'registrations', options, true);
  try {
    const data = await loadUsersAnalytics(projectId, options);
    const mode = options.mode ?? 'period';
    const groupBy = options.groupBy ?? 'total';
    let points;
    if (groupBy === 'source') {
      points = parseUsersSources(await readUsersAnalytics(`${data.base}/growth-by-source?${data.growthQuery}`, options));
      if (mode === 'cumulative') points = accumulateSources(points);
    } else {
      points = mode === 'cumulative' ? calculateCumulativeGrowth(data.points, data.summary.total_users) : data.points;
    }
    return { ...data.summary, from: points[0]?.date ?? null, to: points.at(-1)?.date ?? null,
      mode, group_by: groupBy, points,
      accumulation_scope: mode === 'cumulative' ? (groupBy === 'source' ? 'selected_period' : 'all_time') : null,
      chart_description: groupBy === 'source'
        ? 'Источники deep_link_param; direct означает прямой вход. Накопление источников начинается с нуля в выбранном периоде.'
        : 'В обычном режиме показаны регистрации по слотам. Накопление начинается с total_users минус new_users; это реконструкция по текущим записям, а не история удалённых пользователей.',
    };
  } catch (error) { return analyticsError(error); }
}

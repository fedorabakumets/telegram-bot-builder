/** @fileoverview Сводка долей и динамика регистраций по источникам через API проекта. */
import { USERS_ANALYTICS_WINDOWS } from './users-analytics-types.ts';
import { readUsersAnalytics, validUsersCount } from './users-analytics-read.ts';
import { messagesAnalyticsError } from './messages-analytics-read.ts';
import { parseTrafficSources, parseTrafficSourcesPoints, validTrafficSourcesOptions, type TrafficSourcesOptions } from './traffic-sources-read.ts';

/**
 * Читает текущую аудиторию или прирост за окно существующей карточки.
 * @param projectId - Проект.
 * @param options - Период, бот и предел источников.
 * @returns Сводка и проверенные точки.
 */
async function loadTrafficSources(projectId: number, options: TrafficSourcesOptions) {
  const period = options.period ?? '30d';
  const window = period === 'all' ? null : USERS_ANALYTICS_WINDOWS[period];
  const query = new URLSearchParams();
  if (options.tokenId !== undefined) query.set('tokenId', String(options.tokenId));
  if (window) query.set('granularity', window.granularity);
  const path = window ? 'growth-by-source' : 'traffic';
  const raw = await readUsersAnalytics(`/api/projects/${projectId}/users/${path}?${query}`, { apiBaseUrl: options.apiBaseUrl });
  const points = window ? parseTrafficSourcesPoints(raw) : [];
  const totals = window ? new Map<string, number>() : parseTrafficSources(raw);
  for (const point of points) {
    for (const [source, count] of Object.entries(point.sources)) totals.set(source, (totals.get(source) ?? 0) + count);
  }
  const ranked = [...totals].filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const total = ranked.reduce((sum, [, count]) => sum + count, 0);
  if (!validUsersCount(total)) throw new Error('Некорректный ответ API аналитики');
  const limit = options.topLimit ?? 10;
  const shown = ranked.slice(0, limit);
  const otherCount = ranked.slice(limit).reduce((sum, [, count]) => sum + count, 0);
  return { points, shown, summary: {
    project_id: projectId, token_id: options.tokenId ?? null, period, total_users: total,
    top_limit: limit, source_count: ranked.length,
    sources: shown.map(([source, count]) => ({ source, count, percentage: total ? Math.round(count / total * 1000) / 10 : 0 })),
    other_count: otherCount, other_percentage: total ? Math.round(otherCount / total * 1000) / 10 : 0,
    granularity: window?.granularity ?? null, step: window?.step ?? null,
    from: points[0]?.date ?? null, to: points.at(-1)?.date ?? null, timestamp_timezone: 'UTC',
    bucket_timezone: window ? 'UTC' : null,
    metric_description: 'Число записей bot_users по текущему deep_link_param. Отсутствующий параметр обозначается direct. Один человек у разных ботов может учитываться несколько раз. Параметр может меняться; это не история всех переходов по ссылкам.',
    range_description: period === 'all' ? 'Текущая сохранённая аудитория без ограничения по registered_at; временного ряда нет.'
      : 'Прирост по registered_at за окно API; from/to — начала слотов, не точные границы фильтра. 12w — 84 дня, 12m — 365 дней. Пограничные слоты могут быть неполными.',
    grouping_description: 'Показаны крупнейшие источники; остальные объединены в other_count. Проценты рассчитаны от всей выборки, округлены до десятых и могут не давать ровно 100%.',
  } };
}

/**
 * Возвращает доли источников текущей аудитории либо прироста за окно.
 * @param projectId - Проект.
 * @param options - Фильтры и ограничение ответа.
 * @returns Сводка либо безопасная ошибка.
 */
export async function getTrafficSourcesSummaryInDb(projectId: number, options: TrafficSourcesOptions = {}) {
  if (!validTrafficSourcesOptions(projectId, options, false)) return { error: 'Некорректные параметры аналитики' };
  try { return (await loadTrafficSources(projectId, options)).summary; }
  catch (error) { return messagesAnalyticsError(error); }
}

/**
 * Возвращает динамику тех же топ-источников, сохраняя остальные отдельно.
 * @param projectId - Проект.
 * @param options - Окно, бот и предел источников.
 * @returns Точки с общим числом регистраций либо безопасная ошибка.
 */
export async function getTrafficSourcesChartInDb(projectId: number, options: TrafficSourcesOptions = {}) {
  if (!validTrafficSourcesOptions(projectId, options, true)) return { error: 'Некорректные параметры аналитики' };
  try {
    const { summary, shown, points } = await loadTrafficSources(projectId, options);
    const names = new Set(shown.map(([name]) => name));
    return { ...summary, points: points.map(point => ({ date: point.date,
      total: Object.values(point.sources).reduce((sum, count) => sum + count, 0),
      sources: shown.map(([source]) => ({ source, count: point.sources[source] ?? 0 })),
      other_count: Object.entries(point.sources).filter(([source]) => !names.has(source)).reduce((sum, [, count]) => sum + count, 0),
    })) };
  } catch (error) { return messagesAnalyticsError(error); }
}

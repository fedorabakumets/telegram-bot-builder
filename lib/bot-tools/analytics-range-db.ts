/** @fileoverview Чтение точных диапазонов и сравнение через авторизованный API. */
import { resolveAnalyticsRange, type AnalyticsRangeOptions } from '../../shared/analytics/range.ts';
import { apiFetch } from './api-fetch.ts';
/** Параметры точной аналитики и сравнения. */
export interface RangeAnalyticsOptions extends AnalyticsRangeOptions {
  /** Токен одного бота. */
  tokenId?: number;
  /** Базовый адрес API. */
  apiBaseUrl?: string;
  /** Метрика с доступной временной историей. */
  metric: 'registrations' | 'messages' | 'active_users';
  /** Сравнение с предыдущим окном либо явными датами. */
  comparison?: 'previous' | 'explicit';
  /** Включённая граница сравнения. */
  compare_from?: string;
  /** Исключённая граница сравнения. */
  compare_to?: string;
}
/**
 * Получает единый серверный снимок с проверкой доступа.
 * @param projectId - Проект.
 * @param options - Метрика, границы, шаг и сравнение.
 * @returns Ответ аналитики либо безопасная ошибка.
 */
export async function getAnalyticsRangeInDb(projectId: number, options: RangeAnalyticsOptions) {
  try {
    if (!Number.isSafeInteger(projectId) || projectId <= 0 || (options.tokenId !== undefined && (!Number.isSafeInteger(options.tokenId) || options.tokenId <= 0))) throw new Error('Некорректный проект или токен');
    const range = resolveAnalyticsRange(options);
    const query = new URLSearchParams({ metric: options.metric, from: range.from, to: range.to, step: range.step });
    if (options.tokenId !== undefined) query.set('tokenId', String(options.tokenId));
    for (const key of ['comparison', 'compare_from', 'compare_to'] as const) if (options[key] !== undefined) query.set(key, options[key]!);
    const response = await apiFetch(`/api/projects/${projectId}/analytics/range?${query}`, { apiBaseUrl: options.apiBaseUrl });
    if (!response.ok) return { error: `Не удалось получить аналитику: HTTP ${response.status}` };
    const data = await response.json();
    if (!data?.current || !Array.isArray(data.current.points) || data.current.points.length > 500 ||
      (data.previous && (!Array.isArray(data.previous.points) || data.previous.points.length > 500))) return { error: 'Некорректный ответ API аналитики' };
    return data;
  } catch (error) {
    return { error: error instanceof Error && /^(Некоррект|Укажите|Диапазон)/.test(error.message) ? error.message : 'Не удалось получить аналитику из API приложения' };
  }
}
/**
 * Формирует совместимый ряд основных инструментов из точного диапазона.
 * @param projectId - Проект.
 * @param metric - Метрика.
 * @param options - Фильтры существующей карточки.
 * @param chart - Нужны ли точки.
 * @returns Сводка и ряд выбранного окна с точными границами.
 */
export async function getExactCardAnalytics(projectId: number, metric: RangeAnalyticsOptions['metric'],
  options: AnalyticsRangeOptions & { tokenId?: number; apiBaseUrl?: string; mode?: string; split?: string; groupBy?: string }, chart: boolean) {
  if (options.groupBy === 'source') return { error: 'Точные диапазоны источников пока не поддерживаются' };
  const data = await getAnalyticsRangeInDb(projectId, { ...options, metric });
  if ('error' in data) return data;
  const current = data.current;
  const summary = { project_id: projectId, token_id: options.tokenId ?? null, ...current,
    as_of: data.as_of, timestamp_timezone: 'UTC', bucket_timezone: 'UTC',
    new_users: metric === 'registrations' ? current.summary.count : undefined,
    period_messages: metric === 'messages' ? current.summary.count : undefined,
    incoming_messages: metric === 'messages' ? current.summary.incoming : undefined,
    outgoing_messages: metric === 'messages' ? current.summary.outgoing : undefined,
    active_users: metric === 'active_users' ? current.summary.count : undefined,
    newcomers: metric === 'active_users' ? current.summary.newcomers : undefined,
    returning: metric === 'active_users' ? current.summary.count - current.summary.newcomers : undefined,
    metric_description: metric === 'active_users' ? 'Уникальные user_id за окно; итоги не суммируются по слотам.' : 'События внутри точного [from,to); текущие счётчики за всё время не входят в этот ответ.',
  };
  delete summary.points;
  if (!chart) return summary;
  let accumulated = { count: 0, incoming: 0, outgoing: 0 };
  /** Преобразует точку, сохраняя накопление внутри выбранного окна. */
  const points = current.points.map((point: Record<string, number | string>) => {
    const raw = { count: Number(point.count), incoming: Number(point.incoming), outgoing: Number(point.outgoing) };
    if (options.mode === 'cumulative' && metric !== 'active_users') {
      accumulated = { count: accumulated.count + raw.count, incoming: accumulated.incoming + raw.incoming, outgoing: accumulated.outgoing + raw.outgoing };
    } else accumulated = raw;
    if (metric === 'messages' && options.split === 'direction') return { date: point.date, incoming: accumulated.incoming, outgoing: accumulated.outgoing };
    if (metric === 'active_users' && options.split === 'cohort') return { date: point.date, total: raw.count, newcomers: Number(point.newcomers), returning: raw.count - Number(point.newcomers) };
    return { date: point.date, count: accumulated.count };
  });
  return { ...summary, mode: options.mode ?? 'period', split: options.split ?? 'total', points,
    accumulation_scope: options.mode === 'cumulative' ? 'selected_period' : null };
}

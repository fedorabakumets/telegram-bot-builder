/**
 * @fileoverview Сводка и график групп выбранного бота для агента.
 * @module lib/bot-tools/groups-analytics-db
 */
import { calculateCumulativeGrowth } from '../../shared/analytics/users-growth.ts';
import { parseUsersGrowth, readUsersAnalytics, validUsersCount } from './users-analytics-read.ts';
import { USERS_ANALYTICS_PERIODS, USERS_ANALYTICS_WINDOWS, type UsersAnalyticsPeriod } from './users-analytics-types.ts';

/** Параметры чтения групп одного бота. */
export interface GroupsAnalyticsOptions {
  /** Запись бота. Без неё группы разных ботов не смешиваются. */
  tokenId?: number;
  /** Готовое окно графика. По умолчанию 30 дней. */
  period?: UsersAnalyticsPeriod;
  /** Слоты периода либо накопление до текущего числа групп. */
  mode?: 'period' | 'cumulative';
  /** Адрес панели для проверок. */
  apiBaseUrl?: string;
}

/** Счётчики справочника, которые можно отдать агенту. */
interface GroupsCounts {
  /** Всего групп и супергрупп. */
  total_groups: number;
  /** Бот в чате. */
  available_groups: number;
  /** Бота исключили. */
  kicked_groups: number;
}

const METRIC = 'Группы и супергруппы справочника одного бота. Один чат учитывается один раз. Доступны и исключили берутся из последней проверки доступа; ошибка проверки в эти числа не входит.';

/**
 * Проверяет проект, обязательного бота и параметры графика до запроса.
 * @param projectId - Проект
 * @param options - Бот, период и режим
 * @param chart - Нужны ли период и режим
 * @returns Можно ли звать панель
 */
function validGroupsOptions(projectId: number, options: GroupsAnalyticsOptions, chart: boolean): boolean {
  const tokenOk = Number.isSafeInteger(options.tokenId) && (options.tokenId ?? 0) > 0;
  const chartOk = !chart || (USERS_ANALYTICS_PERIODS.includes(options.period ?? '30d') &&
    ['period', 'cumulative'].includes(options.mode ?? 'period'));
  return Number.isSafeInteger(projectId) && projectId > 0 && tokenOk && chartOk;
}

/**
 * Прячет тело ответа панели и текст сети.
 * @param error - Ошибка чтения
 * @returns Сообщение для агента
 */
function analyticsError(error: unknown): { error: string } {
  const message = error instanceof Error ? error.message : '';
  return { error: /^(Не удалось получить аналитику: HTTP \d{3}|Некорректн)/.test(message)
    ? message : 'Не удалось получить аналитику из API приложения' };
}

/**
 * Оставляет только три счётчика сводки.
 * @param raw - Ответ панели
 * @returns Числа групп
 */
function parseCounts(raw: unknown): GroupsCounts {
  if (!raw || typeof raw !== 'object') throw new Error('Некорректный ответ API аналитики');
  const row = raw as Record<string, unknown>;
  const total = row.totalGroups;
  const available = row.availableGroups;
  const kicked = row.kickedGroups;
  if (!validUsersCount(total) || !validUsersCount(available) || !validUsersCount(kicked) || available > total || kicked > total) {
    throw new Error('Некорректный ответ API аналитики');
  }
  return { total_groups: total, available_groups: available, kicked_groups: kicked };
}

/**
 * Читает текущие числа групп одного бота.
 * @param projectId - Проект
 * @param options - Бот
 * @returns Сводка либо безопасная ошибка
 */
export async function getGroupsSummaryInDb(projectId: number, options: GroupsAnalyticsOptions = {}) {
  if (!validGroupsOptions(projectId, options, false)) return { error: 'Некорректные параметры аналитики' };
  try {
    const query = new URLSearchParams({ tokenId: String(options.tokenId) });
    const raw = await readUsersAnalytics(`/api/projects/${projectId}/groups/analytics/stats?${query}`, options);
    return {
      project_id: projectId, token_id: options.tokenId, ...parseCounts(raw), metric_description: METRIC,
    };
  } catch (error) { return analyticsError(error); }
}

/**
 * Читает ряд первого сохранения групп и при необходимости накапливает его до текущего числа.
 * @param projectId - Проект
 * @param options - Бот, период и режим
 * @returns Точки и описание окна либо безопасная ошибка
 */
export async function getGroupsChartInDb(projectId: number, options: GroupsAnalyticsOptions = {}) {
  if (!validGroupsOptions(projectId, options, true)) return { error: 'Некорректные параметры аналитики' };
  const period = options.period ?? '30d';
  const mode = options.mode ?? 'period';
  const window = USERS_ANALYTICS_WINDOWS[period];
  try {
    const summary = await getGroupsSummaryInDb(projectId, options);
    if ('error' in summary) return summary;
    const query = new URLSearchParams({ tokenId: String(options.tokenId), granularity: window.granularity });
    const slots = parseUsersGrowth(await readUsersAnalytics(
      `/api/projects/${projectId}/groups/analytics/growth?${query}`, options,
    ));
    const points = mode === 'cumulative' ? calculateCumulativeGrowth(slots, summary.total_groups) : slots;
    return {
      ...summary, period, granularity: window.granularity, step: window.step, mode,
      from: points[0]?.date ?? null, to: points.at(-1)?.date ?? null, points,
      timestamp_timezone: 'UTC', bucket_timezone: 'UTC',
      accumulation_scope: mode === 'cumulative' ? 'all_time' : null,
      range_description: 'from и to — начало первого и последнего слота. Точка отмечает первое сохранение группы в панели, а не более раннее вступление, если слежение тогда ещё не работало.',
    };
  } catch (error) { return analyticsError(error); }
}

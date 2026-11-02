/** @fileoverview Проверка общих диапазонов v2 и автоматический шаг полного исторического ряда. */
import { ANALYTICS_PERIOD_MS, ANALYTICS_STEPS, resolveAnalyticsRange, type AnalyticsRangeOptions } from '../../../../shared/analytics/range';
import type { AnalyticsV2Range } from '../../../../shared/analytics/v2';
import { v2BucketCount } from './buckets';
/**
 * Нормализует фильтры и часовой пояс без изменения UTC-границ.
 * @param query - Строковые параметры запроса.
 * @param now - Момент общего снимка.
 * @param earliest - Самый ранний аналитический факт для всего времени.
 * @returns Окно с отдельным шагом.
 */
export function resolveV2Range(query: Record<string, string>, now: number, earliest: string | null): AnalyticsV2Range {
  const timezone = query.timezone || 'Europe/Moscow';
  try { new Intl.DateTimeFormat('ru', { timeZone: timezone }).format(now); }
  catch { throw new Error('Укажите существующий часовой пояс IANA'); }
  if (query.comparison && query.comparison !== 'previous') throw new Error('Поддерживается comparison=previous');
  if (query.period === 'all') {
    if (query.from || query.to) throw new Error('Для всего времени даты не указываются');
    const to = now;
    const from = earliest ? Math.min(Date.parse(earliest), now - 1) : now - ANALYTICS_PERIOD_MS['30d'];
    const steps = [...Object.values(ANALYTICS_STEPS), 90 * 86400000, 365 * 86400000];
    /** Древняя история получает фиксированный крупный шаг, а не заново вычисляемые миллисекунды. */
    let fallback = steps[steps.length - 1];
    while (v2BucketCount(from, to, fallback, timezone) > 500) fallback *= 2;
    const step = query.step ? ANALYTICS_STEPS[query.step as keyof typeof ANALYTICS_STEPS]
      : steps.find(value => v2BucketCount(from, to, value, timezone) <= 500) ?? fallback;
    if (!step || v2BucketCount(from, to, step, timezone) > 500) throw new Error('Шаг должен давать не более 500 точек');
    return { from: new Date(from).toISOString(), to: new Date(to).toISOString(), timezone, step_ms: step, period: 'all' };
  }
  const range = resolveAnalyticsRange(query as AnalyticsRangeOptions, now);
  if (v2BucketCount(Date.parse(range.from), Date.parse(range.to), ANALYTICS_STEPS[range.step], timezone) > 500) {
    throw new Error('Шаг должен давать не более 500 точек с учётом границ периода');
  }
  return { from: range.from, to: range.to, timezone, step_ms: ANALYTICS_STEPS[range.step], period: range.period };
}
/**
 * Возвращает предыдущий интервал равной длительности.
 * @param range - Текущее окно.
 * @returns Окно сравнения.
 */
export function previousV2Range(range: AnalyticsV2Range): AnalyticsV2Range {
  return { ...range, from: new Date(2 * Date.parse(range.from) - Date.parse(range.to)).toISOString(), to: range.from };
}

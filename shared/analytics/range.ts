/** @fileoverview Единые UTC-периоды, независимые шаги и сравнение аналитики. */
/** Длительности готовых окон в миллисекундах. */
export const ANALYTICS_PERIOD_MS = { '1h': 3600000, '3h': 10800000, '24h': 86400000, '7d': 604800000, '30d': 2592000000, '12w': 7257600000, '12m': 31536000000 } as const;
/** Допустимые фиксированные шаги группировки. */
export const ANALYTICS_STEPS = { '1m': 60000, '5m': 300000, '1h': 3600000, '1d': 86400000, '7d': 604800000, '30d': 2592000000 } as const;
/** Фильтры временного диапазона. */
export interface AnalyticsRangeOptions {
  /** Готовое окно без явных дат. */
  period?: keyof typeof ANALYTICS_PERIOD_MS;
  /** Включённая граница в ISO 8601 с часовым поясом. */
  from?: string;
  /** Исключённая граница в ISO 8601 с часовым поясом. */
  to?: string;
  /** Независимый фиксированный шаг графика. */
  step?: keyof typeof ANALYTICS_STEPS;
}
/**
 * Проверяет строгую ISO-дату с указанным часовым поясом.
 * @param value - Дата клиента.
 * @returns Миллисекунды UTC.
 */
function timestamp(value: string): number {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) throw new Error('Некорректная ISO-дата с часовым поясом');
  const day = value.slice(0, 10);
  if (new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) !== day) throw new Error('Некорректная календарная дата');
  if (Number(value.slice(11, 13)) > 23 || Number(value.slice(14, 16)) > 59 || Number(value.slice(17, 19)) > 59) throw new Error('Некорректное время');
  return Date.parse(value);
}
/**
 * Определяет точные границы [from,to) и ограниченный шаг отдельно от периода.
 * @param options - Параметры клиента.
 * @param now - Общий момент снимка.
 * @returns Нормализованное окно.
 */
export function resolveAnalyticsRange(options: AnalyticsRangeOptions, now = Date.now()) {
  if ((options.from === undefined) !== (options.to === undefined) || (options.from !== undefined && options.period !== undefined)) throw new Error('Укажите period либо обе даты from/to');
  const period = options.from !== undefined ? null : options.period ?? '30d';
  if (period !== null && !Object.hasOwn(ANALYTICS_PERIOD_MS, period)) throw new Error('Некорректный период');
  const to = options.to !== undefined ? timestamp(options.to) : now;
  const from = options.from !== undefined ? timestamp(options.from) : to - ANALYTICS_PERIOD_MS[period!];
  const duration = to - from;
  if (!Number.isFinite(duration) || duration <= 0 || duration > ANALYTICS_PERIOD_MS['12m'] || to > now) throw new Error('Диапазон должен быть положительным, до 365 дней и без будущих дат');
  const defaults = { '1h': '1m', '3h': '5m', '24h': '1h', '7d': '1d', '30d': '1d', '12w': '7d', '12m': '30d' } as const;
  const step = options.step ?? (period ? defaults[period] : duration <= 86400000 ? '1h' : '1d');
  if (!Object.hasOwn(ANALYTICS_STEPS, step) || Math.ceil(duration / ANALYTICS_STEPS[step]) > 500) throw new Error('Некорректный шаг или более 500 точек');
  return { from: new Date(from).toISOString(), to: new Date(to).toISOString(), step, period, duration_ms: duration, timezone: 'UTC', boundary: '[from,to)' };
}
/**
 * Вычисляет изменение без выдуманного процента при нулевой базе.
 * @param current - Текущее значение.
 * @param previous - Значение сравнения.
 * @returns Разница и процент либо null при нулевой базе.
 */
export function analyticsChange(current: number, previous: number) {
  return { current, previous, absolute_change: current - previous, percent_change: previous === 0 ? current === 0 ? 0 : null : (current - previous) / previous * 100 };
}

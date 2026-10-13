/**
 * @fileoverview Периоды просмотра логов и перевод локальных границ в абсолютное время.
 */

/** Доступные периоды терминала. */
export type LogPeriod = 'live' | '15m' | '1h' | '24h' | 'today' | 'yesterday' | 'custom';
/** Границы запроса сохранённых логов; правая граница не включается. */
export interface LogPeriodRange {
  /** Начало диапазона в формате ISO */
  from: string;
  /** Конец диапазона в формате ISO */
  to: string;
}
/** Подписи пунктов выбора периода. */
export const LOG_PERIOD_OPTIONS: Array<{
  /** Значение периода */
  value: LogPeriod;
  /** Подпись в интерфейсе */
  label: string;
}> = [
  { value: 'live', label: 'Текущий запуск' },
  { value: '15m', label: 'Последние 15 минут' },
  { value: '1h', label: 'Последний час' },
  { value: '24h', label: 'Последние 24 часа' },
  { value: 'today', label: 'Сегодня' },
  { value: 'yesterday', label: 'Вчера' },
  { value: 'custom', label: 'Свой период' },
];

/**
 * Определяет границы выбранного периода в часовом поясе браузера.
 * @param period - Период просмотра
 * @param now - Момент выбора периода
 * @returns Абсолютные границы или отсутствие диапазона для живых логов
 */
export function resolveLogPeriodRange(period: LogPeriod, now = new Date()): LogPeriodRange | null {
  if (period === 'live' || period === 'custom') return null;
  const from = new Date(now);
  const to = new Date(now);
  const minutes = { '15m': 15, '1h': 60, '24h': 1440 };
  if (period in minutes) from.setTime(now.getTime() - minutes[period as keyof typeof minutes] * 60000);
  else {
    from.setHours(0, 0, 0, 0);
    if (period === 'yesterday') {
      to.setTime(from.getTime());
      from.setDate(from.getDate() - 1);
    }
  }
  return { from: from.toISOString(), to: to.toISOString() };
}

/**
 * Проверяет введённый вручную локальный диапазон.
 * @param from - Локальная дата начала
 * @param to - Локальная дата окончания
 * @returns Границы или отсутствие корректного диапазона
 */
export function parseCustomLogRange(from: string, to: string): LogPeriodRange | null {
  const start = new Date(from);
  const end = new Date(to);
  if (!from || !to || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start >= end) return null;
  return { from: start.toISOString(), to: end.toISOString() };
}

/**
 * Форматирует границы периода с датой и временем.
 * @param range - Абсолютный диапазон
 * @returns Подпись для панели состояния
 */
export function formatLogPeriodRange(range: LogPeriodRange): string {
  const format = (value: string) => new Date(value).toLocaleString('ru-RU', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
  return `${format(range.from)} — ${format(range.to)}`;
}

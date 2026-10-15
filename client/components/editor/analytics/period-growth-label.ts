/**
 * @fileoverview Подпись «+N за период» с датами начала и конца выбранного графика.
 * @module client/components/editor/analytics/period-growth-label
 */

/** Точка ряда: начало отрезка и число за него. */
export interface PeriodCountPoint {
  /** Начало отрезка в ISO. */
  date: string;
  /** Сколько пришлось на отрезок. */
  count: number;
}

/** Готовая подпись и сумма периода. */
export interface PeriodGrowthLabel {
  /** Сумма точек. */
  total: number;
  /** Текст подписи, если за период что-то было. */
  text?: string;
}

const TWO_DAYS_MS = 2 * 86_400_000;

/**
 * Склеивает несколько рядов с одинаковыми датами в один.
 * @param series - Ряды, например входящие и исходящие
 * @returns Точки в порядке первого ряда
 */
export function combinePeriodCounts(...series: PeriodCountPoint[][]): PeriodCountPoint[] {
  const totals = new Map<string, number>();
  const order: string[] = [];
  for (const points of series) {
    for (const point of points) {
      if (!totals.has(point.date)) order.push(point.date);
      totals.set(point.date, (totals.get(point.date) ?? 0) + point.count);
    }
  }
  return order.map((date) => ({ date, count: totals.get(date) ?? 0 }));
}

/**
 * Короткий день и месяц. Год — только если он нужен.
 * @param date - Дата
 * @param withYear - Печатать год
 * @returns Строка вида «15 окт.»
 */
function formatDay(date: Date, withYear: boolean): string {
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  }).replace(/\s*г\.?/g, '');
}

/**
 * Часы и минуты.
 * @param date - Дата
 * @returns Строка вида «10:36»
 */
function formatClock(date: Date): string {
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Даты от и до. На коротком окне добавляет время.
 * @param start - Начало периода
 * @param end - Конец периода
 * @returns Строка «от — до»
 */
function formatRange(start: Date, end: Date): string {
  const withTime = end.getTime() - start.getTime() < TWO_DAYS_MS;
  const withYear = start.getFullYear() !== end.getFullYear();
  const sameDay = start.toDateString() === end.toDateString();
  if (withTime && sameDay) return `${formatDay(start, false)}, ${formatClock(start)} — ${formatClock(end)}`;
  const from = withTime ? `${formatDay(start, withYear)} ${formatClock(start)}` : formatDay(start, withYear);
  const to = withTime ? `${formatDay(end, withYear)} ${formatClock(end)}` : formatDay(end, withYear);
  return `${from} — ${to}`;
}

/**
 * Считает сумму выбранного периода и подписывает её датами от и до.
 * @param points - Ряд графика от старых к новым
 * @param end - Правая граница, по умолчанию сейчас
 * @returns Сумма и текст
 */
export function periodGrowthLabel(points: PeriodCountPoint[], end = new Date()): PeriodGrowthLabel {
  const total = points.reduce((sum, point) => sum + point.count, 0);
  const start = points.length > 0 ? new Date(points[0].date) : end;
  if (total <= 0 || Number.isNaN(start.getTime())) return { total };
  return { total, text: `+${total} за период, ${formatRange(start, end)}` };
}

/** @fileoverview Стабильные часовые UTC-интервалы и календарные дневные интервалы выбранного пояса. */
/**
 * Переводит момент в локальные календарные координаты без применения смещения дважды.
 * @param value - Момент UTC в миллисекундах.
 * @param timezone - Проверенный пояс IANA.
 * @returns Миллисекунды локального календаря относительно календарного Unix epoch.
 */
function calendarCoordinate(value: number, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', { timeZone: timezone, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(value);
  /** Читает числовую часть локального календаря. */
  const part = (type: string) => Number(parts.find(item => item.type === type)?.value);
  const date = new Date(0);
  date.setUTCFullYear(part('year'), part('month') - 1, part('day'));
  date.setUTCHours(part('hour'), part('minute'), part('second'), new Date(value).getUTCMilliseconds());
  return date.getTime();
}
/**
 * Возвращает начало первого интервала по фиксированной сетке Unix epoch.
 * @param from - Начало выбранного окна в миллисекундах UTC.
 * @param step - Длительность интервала в миллисекундах.
 * @returns Начало интервала, включающего левую границу окна.
 */
export function v2BucketOrigin(from: number, step: number): number {
  return Math.floor(from / step) * step;
}
/**
 * Считает интервалы с учётом обрезанных краёв полуоткрытого окна.
 * @param from - Включённое начало окна.
 * @param to - Исключённый конец окна.
 * @param step - Длительность интервала в миллисекундах.
 * @param timezone - Пояс календарных интервалов от суток; короткие интервалы всегда UTC.
 * @returns Число точек стабильной временной сетки.
 */
export function v2BucketCount(from: number, to: number, step: number, timezone = 'UTC'): number {
  if (step >= 86400000) {
    from = calendarCoordinate(from, timezone);
    to = calendarCoordinate(to, timezone);
  }
  return Math.ceil(to / step) - Math.floor(from / step);
}

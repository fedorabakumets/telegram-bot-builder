/** @fileoverview Точные подписи денег и предпросмотр распределения по календарным дням. */
/** Форматирует точную сумму. @param value - Decimal-строка или отсутствие оплаты. @param currency - Валюта. @returns Читаемая сумма без потери точности. */
export function acquisitionMoney(value: string | null, currency: string): string {
  if (value == null) return 'Не указан';
  const [whole, fraction = ''] = value.split('.');
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}${fraction ? `,${fraction}` : ''} ${currency === 'RUB' ? '₽' : '$'}`;
}
/**
 * Делит сумму на целые копейки; остаток распределяется по первым дням.
 * @param amount - Общая точная сумма.
 * @param from - Первый календарный день.
 * @param to - Последний календарный день включительно.
 * @returns Предпросмотр дневных сумм либо пустой массив при ошибке.
 */
export function previewExpenseAllocation(amount: string, from: string, to: string): Array<{ /** День. */ day: string; /** Точная часть суммы. */ amount: string }> {
  if (!/^\d+(?:\.\d{1,2})?$/.test(amount) || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return [];
  const start = Date.parse(`${from}T00:00:00Z`), end = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || new Date(start).toISOString().slice(0, 10) !== from || new Date(end).toISOString().slice(0, 10) !== to) return [];
  const days = (end - start) / 86400000 + 1;
  if (!Number.isInteger(days) || days < 1 || days > 366) return [];
  const [whole, fraction = ''] = amount.split('.');
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  const quotient = cents / BigInt(days), remainder = cents % BigInt(days);
  return Array.from({ length: days }, (_, index) => {
    const part = quotient + (BigInt(index) < remainder ? 1n : 0n);
    return { day: new Date(start + index * 86400000).toISOString().slice(0, 10), amount: `${part / 100n}.${String(part % 100n).padStart(2, '0')}` };
  });
}

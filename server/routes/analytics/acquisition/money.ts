/** @fileoverview Точное распределение рекламной суммы по календарным дням. */
import { AcquisitionError } from './validation';
/** Дневная часть исходной оплаты. */
export interface DailyExpensePart {
  /** Календарный день. */ day: string;
  /** Сумма с двумя десятичными знаками. */ amount: string;
}
/** Переводит проверенную decimal-строку в целые копейки. */
export function toMinorUnits(value: string): bigint {
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
}
/** Форматирует целые копейки без двоичной арифметики. */
export function fromMinorUnits(value: bigint): string {
  return `${value / 100n}.${(value % 100n).toString().padStart(2, '0')}`;
}
/**
 * Распределяет сумму только по явно подтверждённым дням, остаток добавляет последнему.
 * @param amount - Проверенная сумма.
 * @param first - Первый календарный день.
 * @param last - Последний день либо первый день.
 * @returns Части с неизменной общей суммой.
 */
export function allocateExpense(amount: string, first: string, last = first): DailyExpensePart[] {
  const start = Date.parse(`${first}T00:00:00Z`);
  const count = (Date.parse(`${last}T00:00:00Z`) - start) / 86400000 + 1;
  if (!Number.isInteger(count) || count < 1 || count > 366) throw new AcquisitionError('Выберите от 1 до 366 дней');
  const total = toMinorUnits(amount), base = total / BigInt(count);
  return Array.from({ length: count }, (_, index) => ({
    day: new Date(start + index * 86400000).toISOString().slice(0, 10),
    amount: fromMinorUnits(base + (index === count - 1 ? total % BigInt(count) : 0n)),
  }));
}

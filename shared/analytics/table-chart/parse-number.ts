/**
 * @fileoverview Разбор конечного числа в начале текста ячейки.
 */
const LEADING_NUMBER = /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?/;
const SAFE_NUMBER = /^(?:[-+]?\d{1,12}(?:\.\d{0,8})?(?:[eE][-+]?\d{1,2})?|[-+]?\.\d{1,8}(?:[eE][-+]?\d{1,2})?)$/;

/**
 * Берёт конечное число из начала ячейки, как parseFloat для обычных значений.
 * @param raw - Текст ячейки.
 * @returns Число либо null, если начала числа нет или оно неконечное.
 */
export function leadingTableNumber(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const token = raw.trim().match(LEADING_NUMBER)?.[0];
  if (!token || !SAFE_NUMBER.test(token)) return null;
  const value = Number(token);
  return Number.isFinite(value) ? value : null;
}

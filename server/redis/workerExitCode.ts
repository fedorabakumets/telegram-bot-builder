/** @fileoverview Безопасная передача кода завершения воркера через Redis Streams. */

/**
 * Проверяет настоящий код процесса без преобразования неизвестного значения в ноль.
 * @param value - Проверяемое число.
 * @returns Является ли значение допустимым целым кодом процесса.
 */
function validCode(value: number): boolean {
  return Number.isSafeInteger(value) && Math.abs(value) <= 2_147_483_647;
}

/**
 * Кодирует код процесса; завершение сигналом остаётся отсутствием кода.
 * @param code - Код процесса или null при сигнале.
 * @returns Десятичная строка либо undefined для неизвестного кода.
 */
export function encodeWorkerExitCode(code: number | null): string | undefined {
  return typeof code === 'number' && validCode(code) ? String(code) : undefined;
}

/**
 * Разбирает поле Redis без NaN, ложного нуля и потери сигнала у старого значения null.
 * @param raw - Непроверенное поле события исполнителя.
 * @returns Допустимый целый код либо null, если код неизвестен.
 */
export function decodeWorkerExitCode(raw: unknown): number | null {
  if (typeof raw !== 'string' || !/^-?\d+$/.test(raw)) return null;
  const code = Number(raw);
  return validCode(code) ? code : null;
}

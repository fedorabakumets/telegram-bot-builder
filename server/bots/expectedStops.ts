/**
 * @fileoverview Набор токенов, для которых остановка ожидаема (кнопка Стоп).
 * Нужен, чтобы не путать ручной stop с OOM/SIGKILL и не автоперезапускать.
 * @module server/bots/expectedStops
 */

/** tokenId → true, пока идёт намеренная остановка */
const expectedStops = new Set<number>();

/**
 * Пометить токен: остановка ожидаема (не рестартить).
 * @param tokenId - ID токена бота
 */
export function markExpectedStop(tokenId: number): void {
  expectedStops.add(tokenId);
}

/**
 * Снять метку ожидаемой остановки.
 * @param tokenId - ID токена бота
 */
export function clearExpectedStop(tokenId: number): void {
  expectedStops.delete(tokenId);
}

/**
 * Проверить, ожидаема ли остановка для токена.
 * @param tokenId - ID токена бота
 * @returns true если стоп намеренный
 */
export function isExpectedStop(tokenId: number): boolean {
  return expectedStops.has(tokenId);
}

/**
 * Очистить все метки (для тестов).
 */
export function clearAllExpectedStops(): void {
  expectedStops.clear();
}

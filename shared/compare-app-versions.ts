/**
 * @fileoverview Сравнение строк версий BotCraft (2.2.1.1)
 * @module shared/compare-app-versions
 */

/**
 * Разбирает строку версии на числовые части.
 * @param value - Версия, например v2.2.1.1
 * @returns Массив чисел
 */
export function parseAppVersion(value: string): number[] {
  return value
    .trim()
    .replace(/^v/i, "")
    .split(".")
    .map((part) => {
      const parsed = Number.parseInt(part, 10);
      return Number.isFinite(parsed) ? parsed : 0;
    });
}

/**
 * Сравнивает две версии приложения.
 * @param left - Первая версия
 * @param right - Вторая версия
 * @returns -1 если left меньше, 0 если равны, 1 если left больше
 */
export function compareAppVersions(left: string, right: string): number {
  const leftParts = parseAppVersion(left);
  const rightParts = parseAppVersion(right);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const diff = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (diff !== 0) {
      return diff > 0 ? 1 : -1;
    }
  }

  return 0;
}

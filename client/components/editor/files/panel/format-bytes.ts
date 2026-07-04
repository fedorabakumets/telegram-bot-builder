/**
 * @fileoverview Форматирование размера в байтах в человекочитаемый вид.
 * Используется индикатором квоты `StorageQuotaBar` для текста в стиле
 * «37.56 Kb / 1 Gb» (Req 4.1). Единицы: B / Kb / Mb / Gb / Tb (шаг 1024).
 * @module components/editor/files/panel/format-bytes
 */

/** Единицы измерения размера (шаг 1024) */
const UNITS = ['B', 'Kb', 'Mb', 'Gb', 'Tb'] as const;

/**
 * Форматирует число байт в строку с подходящей единицей измерения.
 * Для целых значений дробная часть опускается («1 Gb»), для дробных —
 * показываются два знака после запятой («37.56 Kb»).
 * @param bytes - Размер в байтах (отрицательные и NaN трактуются как 0)
 * @returns Человекочитаемая строка размера, например «37.56 Kb»
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';

  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < UNITS.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const rounded = Number.isInteger(size) ? String(size) : size.toFixed(2);
  return `${rounded} ${UNITS[unitIndex]}`;
}

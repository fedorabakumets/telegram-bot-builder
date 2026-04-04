/**
 * @fileoverview Генератор красивых ID для кнопок
 *
 * Генерирует читаемые ID вида btn_1, btn_2, ... с глобальным счётчиком.
 * Счётчик сохраняется в localStorage чтобы не сбрасываться между сессиями.
 *
 * @module utils/generate-button-id
 */

const STORAGE_KEY = 'btn_counter';

/**
 * Читает текущее значение счётчика из localStorage
 * @returns Текущее значение счётчика
 */
function readCounter(): number {
  try {
    return parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

/**
 * Сохраняет значение счётчика в localStorage
 * @param value - Новое значение
 */
function writeCounter(value: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // игнорируем ошибки localStorage
  }
}

/**
 * Генерирует уникальный читаемый ID для кнопки вида btn_1, btn_2, ...
 * @returns Строка вида "btn_N"
 */
export function generateButtonId(): string {
  const next = readCounter() + 1;
  writeCounter(next);
  return `btn_${next}`;
}

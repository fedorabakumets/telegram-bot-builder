/**
 * @fileoverview Дефолты и нормализация эмодзи отметки multi-select / radio
 * @module templates/keyboard/selection-mark-symbols
 */

/** Символ выбранной галочки по умолчанию */
export const DEFAULT_CHECKMARK_SYMBOL = '✅';
/** Символ выбранного радио по умолчанию */
export const DEFAULT_RADIO_SELECTED_SYMBOL = '🔘';
/** Символ невыбранного радио по умолчанию */
export const DEFAULT_RADIO_UNSELECTED_SYMBOL = '⚪️';

/** Набор символов отметки */
export interface SelectionMarkSymbols {
  /** Выбранная selection без группы */
  checkmarkSymbol: string;
  /** Выбранная selection с selectionGroup */
  radioSelectedSymbol: string;
  /** Невыбранная selection с selectionGroup */
  radioUnselectedSymbol: string;
}

/**
 * Нормализует символы: trim, пустое → дефолт
 * @param data - Сырые поля с ноды
 * @returns Готовые символы для шаблонов
 */
export function resolveSelectionMarkSymbols(data?: {
  checkmarkSymbol?: string | null;
  radioSelectedSymbol?: string | null;
  radioUnselectedSymbol?: string | null;
} | null): SelectionMarkSymbols {
  /**
   * @param value - Сырое значение
   * @param fallback - Дефолт
   * @returns Непустая строка
   */
  const pick = (value: string | null | undefined, fallback: string): string => {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    return trimmed || fallback;
  };

  return {
    checkmarkSymbol: pick(data?.checkmarkSymbol, DEFAULT_CHECKMARK_SYMBOL),
    radioSelectedSymbol: pick(data?.radioSelectedSymbol, DEFAULT_RADIO_SELECTED_SYMBOL),
    radioUnselectedSymbol: pick(data?.radioUnselectedSymbol, DEFAULT_RADIO_UNSELECTED_SYMBOL),
  };
}

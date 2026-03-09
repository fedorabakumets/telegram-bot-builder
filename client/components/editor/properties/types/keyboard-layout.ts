/**
 * @fileoverview Типы для раскладки клавиатуры
 * @module components/editor/properties/types/keyboard-layout
 */

/** Конфигурация одного ряда клавиатуры */
export interface KeyboardRow {
  /** Массив ID кнопок в ряду */
  buttonIds: string[];
}

/** Раскладка клавиатуры */
export interface KeyboardLayout {
  /** Массив рядов кнопок */
  rows: KeyboardRow[];
  /** Количество колонок (1-6) */
  columns: number;
  /** Использовать автоматическую раскладку */
  autoLayout: boolean;
}

/** Пресет раскладки клавиатуры */
export interface KeyboardPreset {
  /** Название пресета */
  name: string;
  /** Количество колонок */
  columns: number;
  /** Описание пресета */
  description: string;
}

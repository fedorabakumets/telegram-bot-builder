/**
 * @fileoverview Конфигурация типа кнопок для ввода ответов
 * @description Содержит опции для выбора типа кнопок (inline/reply).
 */

/** Опция типа кнопки */
export interface ButtonTypeOption {
  /** Значение */
  value: 'inline' | 'reply';
  /** Текст отображения */
  label: string;
}

/** Доступные типы кнопок */
export const BUTTON_TYPE_OPTIONS: ButtonTypeOption[] = [
  { value: 'inline', label: 'Inline кнопки' },
  { value: 'reply', label: 'Reply кнопки' }
];

/**
 * @fileoverview Тип пропсов строки ответа
 * @description Свойства для компонента ResponseRow
 */

/**
 * Свойства строки таблицы ответов
 */
export interface ResponseRowProps {
  /** Ключ переменной */
  variableKey: string;
  /** Сырое значение ответа */
  rawValue: unknown;
}

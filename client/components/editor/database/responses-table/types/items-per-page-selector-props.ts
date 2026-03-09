/**
 * @fileoverview Тип пропсов для выбора количества элементов на странице
 * @description Свойства для компонента ItemsPerPageSelector
 */

/**
 * Возможные значения количества элементов на странице
 */
export type ItemsPerPageValue = 12 | 25 | 50 | 100;

/**
 * Свойства селектора количества элементов
 */
export interface ItemsPerPageSelectorProps {
  /** Текущее значение */
  value: ItemsPerPageValue;
  /** Функция изменения значения */
  onChange: (value: ItemsPerPageValue) => void;
}

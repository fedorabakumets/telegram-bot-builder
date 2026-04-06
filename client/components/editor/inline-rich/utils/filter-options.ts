/**
 * @fileoverview Опции фильтров для переменных inline-rich редактора
 */

/** Опция фильтра переменной */
export interface FilterOption {
  /** Строка фильтра для вставки в текст */
  filter: string;
  /** Разделитель */
  separator: string;
  /** Метка для UI */
  label: string;
  /** Иконка */
  icon: string;
}

/** Доступные фильтры для переменных */
export const VARIABLE_FILTER_OPTIONS: FilterOption[] = [
  { filter: '|join:", "', separator: ', ', label: 'Через запятую', icon: '📝' },
  { filter: '|join:"\\n"', separator: '\n', label: 'В столбик', icon: '📋' },
];

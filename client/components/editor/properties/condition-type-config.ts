/**
 * @fileoverview Конфигурация типов условий для условных сообщений
 */

export type ConditionType = 'user_data_exists' | 'user_data_not_exists' | 'user_data_equals' | 'user_data_contains';

export interface ConditionOption {
  value: ConditionType;
  label: string;
  symbol: string;
  symbolColor: string;
}

export const CONDITION_TYPES: ConditionOption[] = [
  {
    value: 'user_data_exists',
    label: 'Пользователь уже отвечал',
    symbol: '✓',
    symbolColor: 'text-green-600'
  },
  {
    value: 'user_data_not_exists',
    label: 'Пользователь НЕ отвечал',
    symbol: '✕',
    symbolColor: 'text-red-600'
  },
  {
    value: 'user_data_equals',
    label: 'Ответ равен значению',
    symbol: '=',
    symbolColor: 'text-blue-600'
  },
  {
    value: 'user_data_contains',
    label: 'Ответ содержит текст',
    symbol: '⊃',
    symbolColor: 'text-orange-600'
  }
];

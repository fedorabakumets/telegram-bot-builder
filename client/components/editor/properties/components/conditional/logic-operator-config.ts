/**
 * @fileoverview Конфигурация логики для условных сообщений
 * @description Содержит опции логических операторов (AND/OR).
 */

/** Логический оператор */
export type LogicOperator = 'AND' | 'OR';

/** Опция оператора */
export interface LogicOperatorOption {
  /** Значение */
  value: LogicOperator;
  /** Текст отображения */
  label: string;
  /** Описание */
  description: string;
  /** Символ */
  symbol: string;
  /** Цвет символа */
  symbolColor: string;
}

/** Доступные логические операторы */
export const LOGIC_OPERATORS: LogicOperatorOption[] = [
  {
    value: 'AND',
    label: 'И (AND) - ВСЕ вопросы должны быть выполнены',
    description: 'Пользователь должен ответить на ВСЕ выбранные вопросы',
    symbol: '∧',
    symbolColor: 'text-green-600'
  },
  {
    value: 'OR',
    label: 'ИЛИ (OR) - ЛЮБОЙ из вопросов годится',
    description: 'Пользователь может ответить на ЛЮБОЙ из выбранных вопросов',
    symbol: '∨',
    symbolColor: 'text-blue-600'
  }
];

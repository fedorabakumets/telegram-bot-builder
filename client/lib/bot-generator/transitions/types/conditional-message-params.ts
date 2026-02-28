/**
 * @fileoverview Параметры для условного сообщения
 * Используется при генерации условной логики сообщений
 */

/**
 * Параметры для условного сообщения
 */
export interface ConditionalMessageParams {
  /** ID условного сообщения */
  id: string;
  /** Текст сообщения */
  messageText: string;
  /** Условие */
  condition: 'user_data_exists' | 'user_data_equals' | 'user_data_not_equals' | 'user_data_contains';
  /** Имя переменной */
  variableName?: string;
  /** Массив имён переменных */
  variableNames?: string[];
  /** Значение для сравнения */
  variableValue?: string;
  /** Логический оператор */
  logicOperator?: 'AND' | 'OR';
  /** Приоритет выполнения */
  priority?: number;
  /** Ожидать текстовый ввод */
  waitForTextInput?: boolean;
}

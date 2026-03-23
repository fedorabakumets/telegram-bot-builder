/**
 * @fileoverview Параметры шаблона conditional-messages
 * @module templates/conditional-messages/conditional-messages.params
 */

/** Одно условное сообщение */
export interface ConditionalMessage {
  condition?: string;
  variableName?: string;
  variableNames?: string[];
  logicOperator?: 'AND' | 'OR';
  messageText?: string;
  priority?: number;
  fallbackMessage?: string;
}

/** Параметры для генерации кода условных сообщений */
export interface ConditionalMessagesTemplateParams {
  /** Массив условных сообщений */
  conditionalMessages: ConditionalMessage[];
  /** Текст по умолчанию (fallback) */
  defaultText: string;
  /** Уровень отступа (по умолчанию '                ') */
  indentLevel?: string;
}

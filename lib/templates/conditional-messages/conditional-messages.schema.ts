/**
 * @fileoverview Zod схема для валидации параметров шаблона conditional-messages
 * @module templates/conditional-messages/conditional-messages.schema
 */

import { z } from 'zod';

/** Схема одного условного сообщения */
const conditionalMessageSchema = z.object({
  /** Условие */
  condition: z.string().optional(),
  /** Имя переменной */
  variableName: z.string().optional(),
  /** Массив имён переменных */
  variableNames: z.array(z.string()).optional(),
  /** Логический оператор */
  logicOperator: z.enum(['AND', 'OR']).optional(),
  /** Текст сообщения */
  messageText: z.string().optional(),
  /** Приоритет */
  priority: z.number().optional(),
  /** Fallback сообщение */
  fallbackMessage: z.string().optional(),
});

/** Схема для валидации параметров условных сообщений */
export const conditionalMessagesParamsSchema = z.object({
  /** Массив условных сообщений */
  conditionalMessages: z.array(conditionalMessageSchema),
  /** Текст по умолчанию */
  defaultText: z.string(),
  /** Уровень отступа */
  indentLevel: z.string().optional(),
});

export type ConditionalMessagesParams = z.infer<typeof conditionalMessagesParamsSchema>;

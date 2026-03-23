/**
 * @fileoverview Zod схема для валидации параметров multi-select-transition
 * @module templates/handlers/multi-select-transition/multi-select-transition.schema
 */

import { z } from 'zod';

/** Схема соединения между узлами */
export const nodeConnectionSchema = z.object({
  /** Исходный узел */
  source: z.string(),
  /** Целевой узел */
  target: z.string(),
});

/** Схема узла с множественным выбором для переходов */
export const multiSelectNodeForTransitionSchema = z.object({
  // --- Идентификация ---
  /** ID узла */
  id: z.string(),
  /** Данные узла */
  data: z.object({
    /** Target кнопки продолжения */
    continueButtonTarget: z.string().optional(),
    /** Тип клавиатуры */
    keyboardType: z.enum(['inline', 'reply', 'none']).optional(),
    /** Текст сообщения */
    messageText: z.string().optional(),
    /** Команда */
    command: z.string().optional(),
    /** Кнопки */
    buttons: z.array(z.any()).optional(),
  }),
  /** Соединения узла */
  connections: z.array(nodeConnectionSchema).optional(),
});

/** Схема параметров для генерации логики переходов multi-select */
export const multiSelectTransitionParamsSchema = z.object({
  // --- Узлы ---
  /** Узлы с множественным выбором */
  multiSelectNodes: z.array(multiSelectNodeForTransitionSchema),
  /** Все узлы графа */
  nodes: z.array(z.any()),

  // --- Соединения ---
  /** Соединения между узлами */
  connections: z.array(nodeConnectionSchema).optional(),

  // --- Поведение ---
  /** Уровень отступа */
  indentLevel: z.string().optional().default('        '),
});

export type MultiSelectTransitionParams = z.infer<typeof multiSelectTransitionParamsSchema>;

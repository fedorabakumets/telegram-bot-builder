/**
 * @fileoverview Zod схема для валидации параметров button-response обработчика
 * @module templates/handlers/button-response/button-response.schema
 */

import { z } from 'zod';

/** Схема для опции ответа */
const responseOptionSchema = z.object({
  /** Текст опции */
  text: z.string(),
  /** Значение опции */
  value: z.string().optional(),
  /** Действие */
  action: z.string().optional(),
  /** Target для перехода */
  target: z.string().optional(),
  /** URL для action='url' */
  url: z.string().optional(),
});

/** Схема для узла с кнопочным вводом */
const userInputNodeSchema = z.object({
  /** ID узла */
  id: z.string(),
  /** Опции ответа */
  responseOptions: z.array(responseOptionSchema),
  /** Разрешить пропуск */
  allowSkip: z.boolean().optional(),
});

/** Схема для валидации параметров button-response */
export const buttonResponseParamsSchema = z.object({
  // --- Узлы ---
  /** Узлы с кнопочными ответами */
  userInputNodes: z.array(userInputNodeSchema),
  /** Массив всех узлов для навигации */
  allNodes: z.array(z.any()),

  // --- Поведение ---
  /** Есть ли URL кнопки в проекте */
  hasUrlButtonsInProject: z.boolean().optional().default(false),
  /** Уровень отступа */
  indentLevel: z.string().optional().default(''),
});

export type ButtonResponseParams = z.infer<typeof buttonResponseParamsSchema>;

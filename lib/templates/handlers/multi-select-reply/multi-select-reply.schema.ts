/**
 * @fileoverview Zod схема для валидации параметров multi-select reply обработчика
 * @module templates/handlers/multi-select-reply/multi-select-reply.schema
 */

import { z } from 'zod';

/** Схема для кнопки выбора */
const selectionButtonSchema = z.object({
  /** ID кнопки */
  id: z.string(),
  /** Текст кнопки */
  text: z.string(),
  /** Действие кнопки */
  action: z.literal('selection'),
  /** Target для перехода */
  target: z.string().optional(),
});

/** Схема для обычной кнопки */
const regularButtonSchema = z.object({
  /** ID кнопки */
  id: z.string(),
  /** Текст кнопки */
  text: z.string(),
  /** Действие кнопки */
  action: z.enum(['goto', 'url', 'command']),
  /** Target для перехода */
  target: z.string().optional(),
});

/** Схема для кнопки перехода */
const gotoButtonSchema = z.object({
  /** ID кнопки */
  id: z.string(),
  /** Текст кнопки */
  text: z.string(),
  /** Действие кнопки */
  action: z.literal('goto'),
  /** Target для перехода */
  target: z.string(),
  /** Целевой узел */
  targetNode: z.object({
    id: z.string(),
    type: z.string(),
    data: z.object({
      command: z.string().optional(),
    }),
  }).optional(),
});

/** Схема для кнопки завершения */
const completeButtonSchema = z.object({
  /** Текст кнопки */
  text: z.string(),
  /** Target для перехода */
  target: z.string().optional(),
});

/** Схема для данных узла */
const nodeDataSchema = z.object({
  keyboardType: z.enum(['inline', 'reply', 'none']).optional(),
  allowMultipleSelection: z.boolean().optional(),
  buttons: z.array(z.any()).optional(),
  messageText: z.string().optional(),
  continueButtonText: z.string().optional(),
  multiSelectVariable: z.string().optional(),
  resizeKeyboard: z.boolean().optional(),
  oneTimeKeyboard: z.boolean().optional(),
  command: z.string().optional(),
});

/** Схема для целевого узла */
const targetNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: nodeDataSchema,
  keyboardCode: z.string().optional(),
});

/** Схема для узла multi-select reply */
const multiSelectReplyNodeSchema = z.object({
  // --- Идентификация ---
  /** ID узла */
  id: z.string(),
  /** Имя переменной для хранения выборов */
  variableName: z.string(),

  // --- Переходы ---
  /** Target кнопки продолжения */
  continueButtonTarget: z.string().optional(),
  /** Текст кнопки продолжения */
  continueButtonText: z.string().optional(),
  /** Кнопка завершения */
  completeButton: completeButtonSchema.optional(),
  /** Целевой узел для continueButtonTarget */
  targetNode: targetNodeSchema.optional(),

  // --- Кнопки ---
  /** Кнопки выбора (selection) */
  selectionButtons: z.array(selectionButtonSchema),
  /** Обычные кнопки */
  regularButtons: z.array(regularButtonSchema),
  /** Кнопки перехода (goto) */
  gotoButtons: z.array(gotoButtonSchema),

  // --- Поведение ---
  /** Код для adjust() */
  adjustCode: z.string().optional(),
  /** Resize keyboard */
  resizeKeyboard: z.boolean().optional(),
  /** One time keyboard */
  oneTimeKeyboard: z.boolean().optional(),
  /** Текст сообщения */
  messageText: z.string().optional(),
});

/** Схема для валидации параметров multi-select reply */
export const multiSelectReplyParamsSchema = z.object({
  // --- Узлы ---
  /** Массив узлов с reply множественным выбором */
  multiSelectNodes: z.array(multiSelectReplyNodeSchema),
  /** Массив всех узлов для поиска целевых узлов */
  allNodes: z.array(z.any()),
  /** Массив всех ID узлов */
  allNodeIds: z.array(z.string()),

  // --- Поведение ---
  /** Уровень отступа (по умолчанию '') */
  indentLevel: z.string().optional().default(''),
});

export type MultiSelectReplyParams = z.infer<typeof multiSelectReplyParamsSchema>;

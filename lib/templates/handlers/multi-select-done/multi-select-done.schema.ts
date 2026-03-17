/**
 * @fileoverview Zod схема для валидации параметров multi-select done обработчика
 * @module templates/handlers/multi-select-done/multi-select-done.schema
 */

import { z } from 'zod';

/** Схема для кнопки multi-select */
const multiSelectButtonSchema = z.object({
  /** ID кнопки */
  id: z.string(),
  /** Текст кнопки */
  text: z.string(),
  /** Действие кнопки */
  action: z.string(),
  /** Target для перехода */
  target: z.string().optional(),
  /** URL для action='url' */
  url: z.string().optional(),
  /** Pre-computed callback_data */
  callbackData: z.string().optional(),
});

/** Схема для данных узла */
const nodeDataSchema = z.object({
  /** Тип клавиатуры */
  keyboardType: z.enum(['inline', 'reply', 'none']).optional(),
  /** Разрешить множественный выбор */
  allowMultipleSelection: z.boolean().optional(),
  /** Кнопки */
  buttons: z.array(multiSelectButtonSchema).optional(),
  /** Текст сообщения */
  messageText: z.string().optional(),
  /** Текст кнопки продолжения */
  continueButtonText: z.string().optional(),
  /** Переменная для multi-select */
  multiSelectVariable: z.string().optional(),
  /** Resize keyboard */
  resizeKeyboard: z.boolean().optional(),
  /** One time keyboard */
  oneTimeKeyboard: z.boolean().optional(),
});

/** Схема для целевого узла */
const targetNodeSchema = z.object({
  /** ID узла */
  id: z.string(),
  /** Тип узла */
  type: z.string(),
  /** Данные узла */
  data: nodeDataSchema,
  /** Короткий ID */
  shortId: z.string().optional(),
  /** Код для клавиатуры */
  keyboardCode: z.string().optional(),
  /** Код для adjust() */
  adjustCode: z.string().optional(),
});

/** Схема для узла multi-select done */
const multiSelectDoneNodeSchema = z.object({
  // --- Идентификация ---
  /** ID узла */
  id: z.string(),
  /** Имя переменной для хранения выборов */
  variableName: z.string(),

  // --- Переходы ---
  /** Target кнопки продолжения */
  continueButtonTarget: z.string().optional(),
  /** Целевой узел */
  targetNode: targetNodeSchema.optional(),
});

/** Схема для валидации параметров multi-select done */
export const multiSelectDoneParamsSchema = z.object({
  // --- Узлы ---
  /** Массив узлов с множественным выбором */
  multiSelectNodes: z.array(multiSelectDoneNodeSchema),
  /** Массив всех узлов для поиска целевых узлов */
  allNodes: z.array(z.any()),
  /** Массив всех ID узлов для генерации коротких ID */
  allNodeIds: z.array(z.string()),

  // --- Поведение ---
  /** Уровень отступа (по умолчанию '') */
  indentLevel: z.string().optional().default(''),
});

export type MultiSelectDoneParams = z.infer<typeof multiSelectDoneParamsSchema>;

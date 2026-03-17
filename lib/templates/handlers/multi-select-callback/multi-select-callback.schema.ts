/**
 * @fileoverview Zod схема для валидации параметров multi-select callback обработчика
 * @module templates/handlers/multi-select-callback/multi-select-callback.schema
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
  /** Pre-computed значение для callback_data */
  value: z.string(),
  /** Pre-computed обрезанное значение (последние 8 символов) */
  valueTruncated: z.string(),
  /** Pre-computed escaped текст для f-string */
  escapedText: z.string(),
  /** Pre-computed callback_data */
  callbackData: z.string(),
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
  /** URL для action='url' */
  url: z.string().optional(),
});

/** Схема для кнопки завершения */
const completeButtonSchema = z.object({
  /** Текст кнопки */
  text: z.string(),
  /** Target для перехода */
  target: z.string(),
});

/** Схема для узла multi-select */
const multiSelectNodeSchema = z.object({
  // --- Идентификация ---
  /** ID узла */
  id: z.string(),
  /** Короткий ID узла (pre-computed) */
  shortNodeId: z.string(),

  // --- Кнопки ---
  /** Кнопки выбора (selection) */
  selectionButtons: z.array(multiSelectButtonSchema),
  /** Обычные кнопки (goto, url) */
  regularButtons: z.array(regularButtonSchema),
  /** Кнопка завершения */
  completeButton: completeButtonSchema.optional(),

  // --- Поведение ---
  /** Pre-computed callback_data для кнопки "Готово" */
  doneCallbackData: z.string().optional(),
  /** Есть ли раскладка */
  hasKeyboardLayout: z.boolean().optional(),
  /** Авто-раскладка */
  keyboardLayoutAuto: z.boolean().optional(),
  /** Код для adjust() */
  adjustCode: z.string().optional(),
  /** Общее количество кнопок */
  totalButtonsCount: z.number().optional(),
});

/** Схема для валидации параметров multi-select callback */
export const multiSelectCallbackParamsSchema = z.object({
  // --- Узлы ---
  /** Массив узлов с множественным выбором */
  multiSelectNodes: z.array(multiSelectNodeSchema),
  /** Массив всех ID узлов для генерации коротких ID */
  allNodeIds: z.array(z.string()),

  // --- Поведение ---
  /** Уровень отступа (по умолчанию '    ') */
  indentLevel: z.string().optional().default('    '),
});

export type MultiSelectCallbackParams = z.infer<typeof multiSelectCallbackParamsSchema>;

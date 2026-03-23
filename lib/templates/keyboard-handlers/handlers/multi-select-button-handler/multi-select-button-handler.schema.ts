/**
 * @fileoverview Zod схема для валидации параметров multi-select button обработчика
 * @module templates/handlers/multi-select-button-handler/multi-select-button-handler.schema
 */

import { z } from 'zod';

/** Схема для кнопки */
const buttonSchema = z.object({
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
  /** Пропускать сбор данных */
  skipDataCollection: z.boolean().optional(),
});

/** Схема для текущего узла */
const nodeSchema = z.object({
  /** ID узла */
  id: z.string(),
  /** Input variable узла */
  inputVariable: z.string().optional(),
});

/** Схема для целевого узла */
const targetNodeSchema = z.object({
  /** ID узла */
  id: z.string(),
  /** Тип узла */
  type: z.string(),
  /** Разрешён ли множественный выбор */
  allowMultipleSelection: z.boolean().optional(),
  /** Кнопка продолжения */
  continueButtonTarget: z.string().optional(),
  /** Переменная для multi-select */
  multiSelectVariable: z.string().optional(),
  /** Данные узла */
  data: z.object({
    allowMultipleSelection: z.boolean().optional(),
    continueButtonTarget: z.string().optional(),
    multiSelectVariable: z.string().optional(),
    keyboardType: z.enum(['inline', 'reply', 'none']).optional(),
    buttons: z.array(z.any()).optional(),
    messageText: z.string().optional(),
    resizeKeyboard: z.boolean().optional(),
    oneTimeKeyboard: z.boolean().optional(),
    command: z.string().optional(),
  }),
});

/** Схема для узла в списке nodes */
const simpleNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.any(),
});

/** Схема для валидации параметров multi-select button обработчика */
export const multiSelectButtonHandlerParamsSchema = z.object({
  // --- Узлы ---
  /** Целевой узел */
  targetNode: targetNodeSchema.optional(),
  /** Текущий узел */
  node: nodeSchema,
  /** Все узлы для проверки существования целевого */
  nodes: z.array(simpleNodeSchema),

  // --- Идентификация ---
  /** Callback data для идентификации кнопки */
  callbackData: z.string(),
  /** Короткий ID узла для done обработчика */
  shortNodeIdForDone: z.string().optional(),
  /** Объект кнопки */
  button: buttonSchema,

  // --- Поведение ---
  /** Уровень отступа (по умолчанию '    ') */
  indentLevel: z.string().optional().default('    '),
});

export type MultiSelectButtonHandlerParams = z.infer<typeof multiSelectButtonHandlerParamsSchema>;

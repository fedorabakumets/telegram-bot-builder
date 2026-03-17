/**
 * @fileoverview Zod схема для валидации параметров reply-button-handlers
 * @module templates/handlers/reply-button-handlers/reply-button-handlers.schema
 */

import { z } from 'zod';

/** Схема кнопки для reply клавиатуры */
export const replyButtonSchema = z.object({
  /** ID кнопки */
  id: z.string(),
  /** Текст кнопки */
  text: z.string(),
  /** Действие кнопки */
  action: z.string(),
  /** Target для перехода */
  target: z.string().optional(),
});

/** Схема узла с reply клавиатурой */
export const replyNodeSchema = z.object({
  /** ID узла */
  id: z.string(),
  /** Тип узла */
  type: z.string(),
  /** Данные узла */
  data: z.object({
    keyboardType: z.literal('reply'),
    buttons: z.array(replyButtonSchema).optional(),
    allowMultipleSelection: z.boolean().optional(),
  }),
});

/** Схема параметров для генерации обработчиков reply кнопок */
export const replyButtonHandlersParamsSchema = z.object({
  /** Все узлы для генерации обработчиков */
  nodes: z.array(z.any()),
  /** Уровень отступа */
  indentLevel: z.string().optional().default(''),
});

export type ReplyButtonHandlersParams = z.infer<typeof replyButtonHandlersParamsSchema>;

/**
 * @fileoverview Zod схема для валидации параметров reply-button-handlers
 * @module templates/handlers/reply-button-handlers/reply-button-handlers.schema
 */

import { z } from 'zod';

/** Схема кнопки для reply клавиатуры */
export const replyButtonSchema = z.object({
  id: z.string(),
  text: z.string(),
  action: z.string(),
  target: z.string().optional(),
});

/** Схема узла с reply клавиатурой */
export const replyNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    keyboardType: z.literal('reply'),
    buttons: z.array(replyButtonSchema).optional(),
    allowMultipleSelection: z.boolean().optional(),
  }),
});

/** Схема параметров для генерации обработчиков reply кнопок */
export const replyButtonHandlersParamsSchema = z.object({
  nodes: z.array(z.any()),
  indentLevel: z.string().optional().default(''),
});

export type ReplyButtonHandlersParams = z.infer<typeof replyButtonHandlersParamsSchema>;

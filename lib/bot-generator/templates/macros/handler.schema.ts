/**
 * @fileoverview Zod схема для валидации параметров макроса обработчика
 * @module templates/macros/handler.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров макроса обработчика */
export const handlerMacroParamsSchema = z.object({
  node: z.object({
    id: z.string(),
    type: z.enum(['start', 'command', 'callback']),
    data: z.object({
      messageText: z.string().optional(),
      command: z.string().optional(),
      buttons: z.array(z.array(z.object({
        text: z.string(),
        callback_data: z.string().optional(),
        url: z.string().optional(),
      }))).optional(),
      keyboardType: z.enum(['inline', 'reply']).optional(),
    }).optional(),
  }),
  enableComments: z.boolean().optional(),
});

/** Тип параметров макроса (выведен из схемы) */
export type HandlerMacroParams = z.infer<typeof handlerMacroParamsSchema>;

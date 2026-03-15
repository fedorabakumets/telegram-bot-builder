/**
 * @fileoverview Zod схема для валидации параметров клавиатуры
 * @module templates/keyboard/keyboard.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров клавиатуры */
export const keyboardParamsSchema = z.object({
  keyboardType: z.enum(['inline', 'reply', 'none']).default('none'),
  buttons: z.array(z.object({
    id: z.string(),
    text: z.string(),
    action: z.string(),
    target: z.string().optional(),
    url: z.string().optional(),
  })).default([]),
  keyboardLayout: z.object({
    rows: z.array(z.object({
      buttonIds: z.array(z.string()),
    })),
    columns: z.number(),
    autoLayout: z.boolean(),
  }).optional(),
  oneTimeKeyboard: z.boolean().default(false),
  resizeKeyboard: z.boolean().default(true),
});

export type KeyboardParams = z.infer<typeof keyboardParamsSchema>;

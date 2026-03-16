/**
 * @fileoverview Zod схема для валидации параметров клавиатуры
 * @module templates/keyboard/keyboard.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров клавиатуры */
export const keyboardParamsSchema = z.object({
  keyboardType: z.enum(['inline', 'reply', 'none']).optional().default('none'),
  buttons: z.array(z.object({
    id: z.string(),
    text: z.string(),
    action: z.string(),
    target: z.string().optional(),
    url: z.string().optional(),
    requestContact: z.boolean().optional(),
    requestLocation: z.boolean().optional(),
  })).default([]),
  keyboardLayout: z.object({
    rows: z.array(z.object({
      buttonIds: z.array(z.string()),
    })),
    columns: z.number(),
    autoLayout: z.boolean(),
  }).optional(),
  oneTimeKeyboard: z.boolean().optional().default(false),
  resizeKeyboard: z.boolean().optional().default(true),
  
  // Множественный выбор
  allowMultipleSelection: z.boolean().optional().default(false),
  multiSelectVariable: z.string().optional(),
  nodeId: z.string().optional(),
  completeButton: z.object({
    text: z.string(),
    target: z.string(),
  }).optional(),
  
  // Условные сообщения
  enableConditionalMessages: z.boolean().optional().default(false),
  conditionalMessages: z.array(z.object({
    variable: z.string(),
    operator: z.enum(['equals', 'contains', 'greater_than', 'less_than']),
    value: z.string(),
    message: z.string(),
    keyboard: z.string().optional(),
  })).optional(),
  conditionalKeyboardVar: z.string().optional(),
  
  // Медиа
  hasImage: z.boolean().optional().default(false),
  imageUrl: z.string().optional(),
  documentUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  
  // Форматирование
  parseMode: z.enum(['html', 'markdown', 'none']).optional().default('none'),
  
  // Служебные
  indentLevel: z.string().optional().default(''),
  allNodeIds: z.array(z.string()).optional().default([]),
});

export type KeyboardParams = z.infer<typeof keyboardParamsSchema>;

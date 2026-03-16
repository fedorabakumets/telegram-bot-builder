/**
 * @fileoverview Zod схема для валидации параметров command-callback-handler
 * @module templates/handlers/command-callback-handler/command-callback-handler.schema
 */

import { z } from 'zod';

/** Схема кнопки для командной клавиатуры */
export const commandButtonSchema = z.object({
  action: z.string(),
  id: z.string(),
  target: z.string(),
  text: z.string(),
  skipDataCollection: z.boolean().optional(),
});

/** Схема типа узла команды */
export const commandNodeTypeSchema = z.enum(['start', 'command', '']).default('');

/** Схема параметров для генерации обработчика командной callback кнопки */
export const commandCallbackHandlerParamsSchema = z.object({
  callbackData: z.string(),
  button: commandButtonSchema,
  indentLevel: z.string().optional().default(''),
  commandNode: commandNodeTypeSchema,
  command: z.string().optional().default(''),
});

export type CommandCallbackHandlerParams = z.infer<typeof commandCallbackHandlerParamsSchema>;

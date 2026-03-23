/**
 * @fileoverview Zod схема для валидации параметров command-callback-handler
 * @module templates/handlers/command-callback-handler/command-callback-handler.schema
 */

import { z } from 'zod';

/** Схема кнопки для командной клавиатуры */
export const commandButtonSchema = z.object({
  /** Действие кнопки */
  action: z.string(),
  /** ID кнопки */
  id: z.string(),
  /** Target для перехода */
  target: z.string(),
  /** Текст кнопки */
  text: z.string(),
  /** Пропускать сбор данных */
  skipDataCollection: z.boolean().optional(),
});

/** Схема типа узла команды */
export const commandNodeTypeSchema = z.enum(['start', 'command', '']).default('');

/** Схема параметров для генерации обработчика командной callback кнопки */
export const commandCallbackHandlerParamsSchema = z.object({
  // --- Идентификация ---
  /** Callback data для идентификации кнопки */
  callbackData: z.string(),
  /** Объект кнопки */
  button: commandButtonSchema,

  // --- Поведение ---
  /** Уровень отступа */
  indentLevel: z.string().optional().default(''),
  /** Тип узла команды (start, command, или пустая строка) */
  commandNode: commandNodeTypeSchema,
  /** Имя команды (без cmd_) */
  command: z.string().optional().default(''),
});

export type CommandCallbackHandlerParams = z.infer<typeof commandCallbackHandlerParamsSchema>;

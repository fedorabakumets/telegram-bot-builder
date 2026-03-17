/**
 * @fileoverview Zod схема для валидации параметров шаблона command-navigation
 * @module templates/command-navigation/command-navigation.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров навигации к узлу команды */
export const commandNavigationParamsSchema = z.object({
  /** Имя команды без '/' */
  commandName: z.string(),
  /** Имя функции-обработчика */
  handlerName: z.string(),
  /** Уровень отступа */
  indentLevel: z.string().optional(),
});

export type CommandNavigationParams = z.infer<typeof commandNavigationParamsSchema>;

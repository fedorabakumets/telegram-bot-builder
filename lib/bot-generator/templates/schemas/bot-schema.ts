/**
 * @fileoverview Zod схема для валидации параметров бота
 * @module templates/schemas/bot-schema
 */

import { z } from 'zod';

/** Схема узла бота */
export const botNodeSchema = z.object({
  name: z.string(),
  command: z.string().optional(),
  type: z.string().optional(),
});

/** Схема для валидации параметров бота */
export const botParamsSchema = z.object({
  botName: z.string(),
  nodes: z.array(botNodeSchema),
  userDatabaseEnabled: z.boolean().default(false),
  projectId: z.number().nullable().default(null),
  enableComments: z.boolean().default(true),
  enableLogging: z.boolean().default(true),
  botFatherCommands: z.string().optional(),
  hasInlineButtons: z.boolean().default(false),
  hasAutoTransitions: z.boolean().default(false),
  hasMediaNodes: z.boolean().default(false),
  hasUploadImages: z.boolean().default(false),
});

/** Тип параметров бота (выведен из схемы) */
export type BotParams = z.infer<typeof botParamsSchema>;

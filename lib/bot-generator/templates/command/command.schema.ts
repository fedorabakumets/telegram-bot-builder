/**
 * @fileoverview Zod схема для валидации параметров обработчика команд
 * @module templates/command/command.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров обработчика команд */
export const commandParamsSchema = z.object({
  nodeId: z.string(),
  command: z.string(),
  messageText: z.string().default(''),
  isPrivateOnly: z.boolean(),
  adminOnly: z.boolean().default(false),
  requiresAuth: z.boolean().default(false),
  userDatabaseEnabled: z.boolean().default(false),
  synonyms: z.array(z.string()).default([]),
  enableConditionalMessages: z.boolean().default(false),
  conditionalMessages: z.array(z.object({
    condition: z.string(),
    variableName: z.string().optional(),
    priority: z.number().optional(),
    buttons: z.array(z.object({
      text: z.string(),
      action: z.string(),
      target: z.string(),
      id: z.string(),
    })).optional(),
    collectUserInput: z.boolean().optional(),
    inputVariable: z.string().optional(),
    nextNodeAfterInput: z.string().optional(),
    waitForTextInput: z.boolean().optional(),
    enableTextInput: z.boolean().optional(),
  })).default([]),
  fallbackMessage: z.string().default(''),
  keyboardType: z.enum(['inline', 'reply', 'none']),
  buttons: z.array(z.object({
    text: z.string(),
    action: z.string(),
    target: z.string(),
    id: z.string(),
  })).default([]),
  formatMode: z.enum(['html', 'markdown', 'none']),
  imageUrl: z.string().default(''),
  documentUrl: z.string().default(''),
  videoUrl: z.string().default(''),
  audioUrl: z.string().default(''),
  attachedMedia: z.array(z.string()).default([]),
});

/** Тип параметров обработчика команд (выведен из схемы) */
export type CommandParams = z.infer<typeof commandParamsSchema>;

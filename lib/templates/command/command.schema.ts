/**
 * @fileoverview Zod схема для валидации параметров обработчика команд
 * @module templates/command/command.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров обработчика команд */
export const commandParamsSchema = z.object({
  nodeId: z.string(),
  command: z.string(),
  messageText: z.string().optional(),
  isPrivateOnly: z.boolean().optional(),
  adminOnly: z.boolean().optional(),
  requiresAuth: z.boolean().optional(),
  userDatabaseEnabled: z.boolean().optional(),
  synonyms: z.array(z.string()).optional(),
  enableConditionalMessages: z.boolean().optional(),
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
  })).optional(),
  fallbackMessage: z.string().optional(),
  keyboardType: z.enum(['inline', 'reply', 'none']).optional(),
  buttons: z.array(z.object({
    text: z.string(),
    action: z.string(),
    target: z.string(),
    id: z.string(),
  })).optional(),
  formatMode: z.enum(['html', 'markdown', 'none']).optional(),
  imageUrl: z.string().optional(),
  documentUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  attachedMedia: z.array(z.string()).optional(),
});

/** Тип параметров обработчика команд (выведен из схемы) */
export type CommandParams = z.infer<typeof commandParamsSchema>;

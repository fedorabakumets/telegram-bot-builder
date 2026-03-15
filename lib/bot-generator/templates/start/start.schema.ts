/**
 * @fileoverview Zod схема для валидации параметров обработчика /start
 * @module templates/start/start.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров обработчика /start */
export const startParamsSchema = z.object({
  nodeId: z.string(),
  messageText: z.string().optional(),
  isPrivateOnly: z.boolean().optional(),
  adminOnly: z.boolean().optional(),
  requiresAuth: z.boolean().optional(),
  userDatabaseEnabled: z.boolean().optional(),
  synonyms: z.array(z.string()).optional(),
  allowMultipleSelection: z.boolean().optional(),
  multiSelectVariable: z.string().optional(),
  buttons: z.array(z.object({
    text: z.string(),
    action: z.string(),
    target: z.string(),
    id: z.string(),
  })).optional(),
  keyboardType: z.enum(['inline', 'reply', 'none']).optional(),
  enableAutoTransition: z.boolean().optional(),
  autoTransitionTo: z.string().optional(),
  collectUserInput: z.boolean().optional(),
  formatMode: z.enum(['html', 'markdown', 'none']).optional(),
  imageUrl: z.string().optional(),
  documentUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  attachedMedia: z.array(z.string()).optional(),
});

/** Тип параметров обработчика /start (выведен из схемы) */
export type StartParams = z.infer<typeof startParamsSchema>;

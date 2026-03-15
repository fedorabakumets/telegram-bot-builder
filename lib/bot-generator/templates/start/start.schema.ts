/**
 * @fileoverview Zod схема для валидации параметров обработчика /start
 * @module templates/start/start.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров обработчика /start */
export const startParamsSchema = z.object({
  nodeId: z.string(),
  messageText: z.string().default(''),
  isPrivateOnly: z.boolean().default(false),
  adminOnly: z.boolean().default(false),
  requiresAuth: z.boolean().default(false),
  userDatabaseEnabled: z.boolean().default(false),
  synonyms: z.array(z.string()).default([]),
  allowMultipleSelection: z.boolean().default(false),
  multiSelectVariable: z.string().default(''),
  buttons: z.array(z.object({
    text: z.string(),
    action: z.string(),
    target: z.string(),
    id: z.string(),
  })).default([]),
  keyboardType: z.enum(['inline', 'reply', 'none']).default('none'),
  enableAutoTransition: z.boolean().default(false),
  autoTransitionTo: z.string().default(''),
  collectUserInput: z.boolean().default(false),
  formatMode: z.enum(['html', 'markdown', 'none']).default('none'),
  imageUrl: z.string().default(''),
  documentUrl: z.string().default(''),
  videoUrl: z.string().default(''),
  audioUrl: z.string().default(''),
  attachedMedia: z.array(z.string()).default([]),
});

/** Тип параметров обработчика /start (выведен из схемы) */
export type StartParams = z.infer<typeof startParamsSchema>;

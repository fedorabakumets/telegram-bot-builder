/**
 * @fileoverview Zod схема для валидации параметров рассылки
 * @module templates/broadcast/broadcast.schema
 */

import { z } from 'zod';

const broadcastNodeSchema = z.object({
  id: z.string(),
  text: z.string().default(''),
  formatMode: z.string().default('none'),
  imageUrl: z.string().default(''),
  audioUrl: z.string().default(''),
  videoUrl: z.string().default(''),
  documentUrl: z.string().default(''),
  attachedMedia: z.array(z.string()).default([]),
  autoTransitionTo: z.string().default(''),
});

/** Схема для валидации параметров рассылки */
export const broadcastParamsSchema = z.object({
  nodeId: z.string(),
  broadcastApiType: z.enum(['bot', 'client']).default('bot'),
  idSourceType: z.enum(['user_ids', 'bot_users', 'both']).default('bot_users'),
  successMessage: z.string().default(''),
  errorMessage: z.string().default(''),
  broadcastNodes: z.array(broadcastNodeSchema).default([]),
  broadcastTargetNode: z.string().default(''),
  enableBroadcast: z.boolean().default(true),
  enableConfirmation: z.boolean().default(false),
  confirmationText: z.string().default(''),
  messageText: z.string().default(''),
});

/** Тип параметров рассылки (выведен из схемы) */
export type BroadcastParams = z.infer<typeof broadcastParamsSchema>;

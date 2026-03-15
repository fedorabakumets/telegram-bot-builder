/**
 * @fileoverview Zod схема для валидации параметров рассылки
 * @module templates/broadcast/broadcast.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров рассылки */
export const broadcastParamsSchema = z.object({
  nodeId: z.string(),
  broadcastApiType: z.enum(['bot', 'client']).optional(),
  broadcastTargetNode: z.string().optional(),
  enableBroadcast: z.boolean().optional(),
  enableConfirmation: z.boolean().optional(),
  confirmationText: z.string().optional(),
  successMessage: z.string().optional(),
  errorMessage: z.string().optional(),
  idSourceType: z.enum(['user_ids', 'bot_users', 'both']).optional(),
  messageText: z.string().optional(),
});

/** Тип параметров рассылки (выведен из схемы) */
export type BroadcastParams = z.infer<typeof broadcastParamsSchema>;

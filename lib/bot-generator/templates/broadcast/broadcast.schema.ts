/**
 * @fileoverview Zod схема для валидации параметров рассылки
 * @module templates/broadcast/broadcast.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров рассылки */
export const broadcastParamsSchema = z.object({
  nodeId: z.string(),
  broadcastApiType: z.enum(['bot', 'client']).default('bot'),
  broadcastTargetNode: z.string().default(''),
  enableBroadcast: z.boolean().default(true),
  enableConfirmation: z.boolean().default(true),
  confirmationText: z.string().default('✅ Рассылка запущена'),
  successMessage: z.string().default(''),
  errorMessage: z.string().default(''),
  idSourceType: z.enum(['user_ids', 'bot_users', 'both']).default('user_ids'),
  messageText: z.string().default(''),
});

/** Тип параметров рассылки (выведен из схемы) */
export type BroadcastParams = z.infer<typeof broadcastParamsSchema>;

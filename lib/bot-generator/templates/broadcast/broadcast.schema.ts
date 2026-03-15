/**
 * @fileoverview Zod схема для валидации параметров рассылки
 * @module templates/broadcast/broadcast.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров рассылки */
export const broadcastParamsSchema = z.object({
  nodeId: z.string(),
  broadcastApiType: z.enum(['bot', 'client']),
  broadcastTargetNode: z.string().default(''),
  enableBroadcast: z.boolean(),
  enableConfirmation: z.boolean().default(false),
  confirmationText: z.string().default('Подтвердите рассылку'),
  successMessage: z.string().default('Рассылка выполнена успешно'),
  errorMessage: z.string().default('Произошла ошибка при рассылке'),
  idSourceType: z.enum(['user_ids', 'bot_users', 'both']),
  messageText: z.string().default(''),
});

/** Тип параметров рассылки (выведен из схемы) */
export type BroadcastParams = z.infer<typeof broadcastParamsSchema>;

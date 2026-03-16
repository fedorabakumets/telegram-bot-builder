/**
 * @fileoverview Zod схема для валидации параметров голосового сообщения
 * @module templates/voice/voice.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров голосового сообщения */
export const voiceParamsSchema = z.object({
  nodeId: z.string(),
  voiceUrl: z.string().optional(),
  mediaCaption: z.string().optional(),
  mediaDuration: z.number().optional(),
  disableNotification: z.boolean().optional(),
});

/** Тип параметров голосового сообщения (выведен из схемы) */
export type VoiceParams = z.infer<typeof voiceParamsSchema>;

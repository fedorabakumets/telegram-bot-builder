/**
 * @fileoverview Zod схема для валидации параметров голосового сообщения
 * @module templates/voice/voice.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров голосового сообщения */
export const voiceParamsSchema = z.object({
  // --- Идентификация ---
  /** Уникальный идентификатор узла */
  nodeId: z.string(),

  // --- Медиа ---
  /** URL голосового сообщения для отправки */
  voiceUrl: z.string().optional(),

  // --- Поведение ---
  /** Подпись к голосовому сообщению */
  mediaCaption: z.string().optional(),
  /** Длительность голосового сообщения в секундах */
  mediaDuration: z.number().optional(),
  /** Отправить без уведомления */
  disableNotification: z.boolean().optional(),
});

/** Тип параметров голосового сообщения (выведен из схемы) */
export type VoiceParams = z.infer<typeof voiceParamsSchema>;

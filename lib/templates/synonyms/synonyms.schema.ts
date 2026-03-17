/**
 * @fileoverview Zod схема для валидации параметров обработчиков синонимов
 * @module templates/synonyms/synonyms.schema
 */

import { z } from 'zod';

const synonymNodeTypeSchema = z.enum([
  'start',
  'command',
  'message',
  'pin_message',
  'unpin_message',
  'delete_message',
  'ban_user',
  'unban_user',
  'mute_user',
  'unmute_user',
  'kick_user',
  'promote_user',
  'demote_user',
  'admin_rights',
]);

const synonymEntrySchema = z.object({
  // --- Основные ---
  /** Текст синонима */
  synonym: z.string(),
  /** ID узла */
  nodeId: z.string(),
  /** Тип узла */
  nodeType: synonymNodeTypeSchema,

  // --- Для command/start ---
  /** Имя функции */
  functionName: z.string().optional(),
  /** Оригинальная команда */
  originalCommand: z.string().optional(),

  // --- Для content management (pin/unpin/delete) ---
  /** Текст сообщения */
  messageText: z.string().optional(),
  /** Без уведомления */
  disableNotification: z.boolean().optional(),

  // --- Для ban/kick/mute ---
  /** Причина */
  reason: z.string().optional(),
  /** Unix timestamp окончания бана (0 = навсегда) */
  untilDate: z.number().optional(),
  /** Длительность мута в секундах */
  duration: z.number().optional(),
  /** Разрешить отправку сообщений */
  canSendMessages: z.boolean().optional(),
  /** Разрешить отправку медиа */
  canSendMediaMessages: z.boolean().optional(),

  // --- Для promote_user ---
  /** Удаление сообщений */
  canDeleteMessages: z.boolean().optional(),
  /** Приглашение пользователей */
  canInviteUsers: z.boolean().optional(),
  /** Закрепление сообщений */
  canPinMessages: z.boolean().optional(),
});

export const synonymsParamsSchema = z.object({
  /** Массив синонимов */
  synonyms: z.array(synonymEntrySchema),
});

export type SynonymsParams = z.infer<typeof synonymsParamsSchema>;

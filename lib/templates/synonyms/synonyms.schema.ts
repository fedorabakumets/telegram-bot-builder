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
  /** Разрешить аудио */
  canSendAudios: z.boolean().optional(),
  /** Разрешить документы */
  canSendDocuments: z.boolean().optional(),
  /** Разрешить фото */
  canSendPhotos: z.boolean().optional(),
  /** Разрешить видео */
  canSendVideos: z.boolean().optional(),
  /** Разрешить видеозаметки */
  canSendVideoNotes: z.boolean().optional(),
  /** Разрешить голосовые */
  canSendVoiceNotes: z.boolean().optional(),
  /** Разрешить опросы */
  canSendPolls: z.boolean().optional(),
  /** Разрешить стикеры и прочие сообщения */
  canSendOtherMessages: z.boolean().optional(),
  /** Разрешить предпросмотр ссылок */
  canAddWebPagePreviews: z.boolean().optional(),
  /** Разрешить реакции */
  canReactToMessages: z.boolean().optional(),
  /** Разрешить менять описание группы */
  canChangeGroupInfo: z.boolean().optional(),
  /** Разрешить приглашения */
  canInviteUsers2: z.boolean().optional(),
  /** Разрешить закрепление */
  canPinMessages2: z.boolean().optional(),

  // --- Для promote_user ---
  /** Удаление сообщений */
  canDeleteMessages: z.boolean().optional(),
  /** Приглашение пользователей */
  canInviteUsers: z.boolean().optional(),
  /** Закрепление сообщений */
  canPinMessages: z.boolean().optional(),
  /** Управлять чатом, только если задано */
  canManageChat: z.boolean().optional(),
  /** Публиковать сообщения, только если задано */
  canPostMessages: z.boolean().optional(),
  /** Редактировать сообщения, только если задано */
  canEditMessages: z.boolean().optional(),
  /** Управлять личными сообщениями, только если задано */
  canManageDirectMessages: z.boolean().optional(),
  /** Управлять тегами, только если задано */
  canManageTags: z.boolean().optional(),
  /** Отправлять приветствия, только если задано */
  canSendWelcomeMessages: z.boolean().optional(),
});

export const synonymsParamsSchema = z.object({
  /** Массив синонимов */
  synonyms: z.array(synonymEntrySchema),
});

export type SynonymsParams = z.infer<typeof synonymsParamsSchema>;

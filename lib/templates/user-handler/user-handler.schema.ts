/**
 * @fileoverview Zod схема для валидации параметров обработчиков управления пользователями
 * @module templates/user-handler/user-handler.schema
 */

import { z } from 'zod';

export const userHandlerNodeTypeSchema = z.enum([
  'ban_user',
  'unban_user',
  'kick_user',
  'mute_user',
  'unmute_user',
  'promote_user',
  'demote_user',
]);

export const userHandlerParamsSchema = z.object({
  // --- Идентификация ---
  /** Тип узла управления пользователем */
  nodeType: userHandlerNodeTypeSchema,
  /** ID узла */
  nodeId: z.string(),
  /** Безопасное имя функции (safe_name от nodeId) */
  safeName: z.string(),

  // --- Триггеры ---
  /** Список текстовых синонимов-триггеров (min 1) */
  synonyms: z.array(z.string()).min(1),
  /** ID конкретной группы, или '' для всех групп */
  targetGroupId: z.string().optional().default(''),

  // --- ban_user / kick_user ---
  /** Причина бана или кика */
  reason: z.string().optional(),
  /** Unix timestamp окончания бана (0 = навсегда) */
  untilDate: z.number().optional().default(0),

  // --- mute_user ---
  /** Длительность мута в секундах */
  duration: z.number().optional().default(3600),
  /** Разрешить отправку сообщений */
  canSendMessages: z.boolean().optional().default(false),
  /** Разрешить отправку медиа */
  canSendMediaMessages: z.boolean().optional().default(false),
  /** Разрешить отправку опросов */
  canSendPolls: z.boolean().optional().default(false),
  /** Разрешить отправку других сообщений */
  canSendOtherMessages: z.boolean().optional().default(false),
  /** Разрешить предпросмотр ссылок */
  canAddWebPagePreviews: z.boolean().optional().default(false),
  /** Разрешить изменение информации группы */
  canChangeGroupInfo: z.boolean().optional().default(false),
  /** Разрешить приглашение пользователей (mute) */
  canInviteUsers2: z.boolean().optional().default(false),
  /** Разрешить закрепление сообщений (mute) */
  canPinMessages2: z.boolean().optional().default(false),

  // --- promote_user ---
  /** Изменение информации группы */
  canChangeInfo: z.boolean().optional().default(false),
  /** Удаление сообщений */
  canDeleteMessages: z.boolean().optional().default(true),
  /** Приглашение пользователей */
  canInviteUsers: z.boolean().optional().default(true),
  /** Блокировка участников */
  canRestrictMembers: z.boolean().optional().default(false),
  /** Закрепление сообщений */
  canPinMessages: z.boolean().optional().default(true),
  /** Назначение администраторов */
  canPromoteMembers: z.boolean().optional().default(false),
  /** Управление видеочатами */
  canManageVideoChats: z.boolean().optional().default(false),
  /** Управление темами */
  canManageTopics: z.boolean().optional().default(false),
  /** Анонимность администратора */
  isAnonymous: z.boolean().optional().default(false),
});

export type UserHandlerParams = z.infer<typeof userHandlerParamsSchema>;

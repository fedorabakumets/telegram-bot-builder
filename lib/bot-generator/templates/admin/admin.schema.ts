/**
 * @fileoverview Zod схема для валидации параметров административных действий
 * @module templates/admin/admin.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров административных действий */
export const adminParamsSchema = z.object({
  nodeId: z.string(),
  adminActionType: z.enum([
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
  ]),
  targetMessageId: z.string().default(''),
  messageIdSource: z.enum(['manual', 'variable', 'last_message']).default('last_message'),
  targetUserId: z.string().default(''),
  userIdSource: z.enum(['manual', 'variable', 'last_message']).default('last_message'),
  untilDate: z.number().optional(),
  reason: z.string().default(''),
  muteDuration: z.number().optional(),
  adminTargetUserId: z.string().default(''),
  canManageChat: z.boolean(),
  canDeleteMessages: z.boolean(),
  canManageVideoChats: z.boolean(),
  canRestrictMembers: z.boolean(),
  canPromoteMembers: z.boolean(),
  canChangeInfo: z.boolean(),
  canInviteUsers: z.boolean(),
  canPinMessages: z.boolean(),
  canManageTopics: z.boolean(),
  isAnonymous: z.boolean(),
  disableNotification: z.boolean(),
});

/** Тип параметров административных действий (выведен из схемы) */
export type AdminParams = z.infer<typeof adminParamsSchema>;

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
  canManageChat: z.boolean().default(false),
  canDeleteMessages: z.boolean().default(false),
  canManageVideoChats: z.boolean().default(false),
  canRestrictMembers: z.boolean().default(false),
  canPromoteMembers: z.boolean().default(false),
  canChangeInfo: z.boolean().default(false),
  canInviteUsers: z.boolean().default(false),
  canPinMessages: z.boolean().default(false),
  canManageTopics: z.boolean().default(false),
  isAnonymous: z.boolean().default(false),
  disableNotification: z.boolean().default(false),
});

/** Тип параметров административных действий (выведен из схемы) */
export type AdminParams = z.infer<typeof adminParamsSchema>;

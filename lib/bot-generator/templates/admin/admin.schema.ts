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
  targetMessageId: z.string().optional(),
  messageIdSource: z.enum(['manual', 'variable', 'last_message']).optional(),
  targetUserId: z.string().optional(),
  userIdSource: z.enum(['manual', 'variable', 'last_message']).optional(),
  untilDate: z.number().optional(),
  reason: z.string().optional(),
  muteDuration: z.number().optional(),
  adminTargetUserId: z.string().optional(),
  canManageChat: z.boolean().optional(),
  canDeleteMessages: z.boolean().optional(),
  canManageVideoChats: z.boolean().optional(),
  canRestrictMembers: z.boolean().optional(),
  canPromoteMembers: z.boolean().optional(),
  canChangeInfo: z.boolean().optional(),
  canInviteUsers: z.boolean().optional(),
  canPinMessages: z.boolean().optional(),
  canManageTopics: z.boolean().optional(),
  isAnonymous: z.boolean().optional(),
  disableNotification: z.boolean().optional(),
  synonyms: z.array(z.string()).optional(),
});

/** Тип параметров административных действий (выведен из схемы) */
export type AdminParams = z.infer<typeof adminParamsSchema>;

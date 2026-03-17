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
  nodeType: userHandlerNodeTypeSchema,
  nodeId: z.string(),
  safeName: z.string(),
  synonyms: z.array(z.string()).min(1),
  targetGroupId: z.string().optional().default(''),
  // ban / kick
  reason: z.string().optional(),
  untilDate: z.number().optional().default(0),
  // mute
  duration: z.number().optional().default(3600),
  canSendMessages: z.boolean().optional().default(false),
  canSendMediaMessages: z.boolean().optional().default(false),
  canSendPolls: z.boolean().optional().default(false),
  canSendOtherMessages: z.boolean().optional().default(false),
  canAddWebPagePreviews: z.boolean().optional().default(false),
  canChangeGroupInfo: z.boolean().optional().default(false),
  canInviteUsers2: z.boolean().optional().default(false),
  canPinMessages2: z.boolean().optional().default(false),
  // promote
  canChangeInfo: z.boolean().optional().default(false),
  canDeleteMessages: z.boolean().optional().default(true),
  canInviteUsers: z.boolean().optional().default(true),
  canRestrictMembers: z.boolean().optional().default(false),
  canPinMessages: z.boolean().optional().default(true),
  canPromoteMembers: z.boolean().optional().default(false),
  canManageVideoChats: z.boolean().optional().default(false),
  canManageTopics: z.boolean().optional().default(false),
  isAnonymous: z.boolean().optional().default(false),
});

export type UserHandlerParams = z.infer<typeof userHandlerParamsSchema>;

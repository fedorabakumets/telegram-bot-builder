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
  synonym: z.string(),
  nodeId: z.string(),
  nodeType: synonymNodeTypeSchema,
  functionName: z.string().optional(),
  originalCommand: z.string().optional(),
  messageText: z.string().optional(),
  disableNotification: z.boolean().optional(),
});

export const synonymsParamsSchema = z.object({
  synonyms: z.array(synonymEntrySchema),
});

export type SynonymsParams = z.infer<typeof synonymsParamsSchema>;

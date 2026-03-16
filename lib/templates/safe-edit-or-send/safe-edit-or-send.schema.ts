/**
 * @fileoverview Zod схема для валидации параметров safe_edit_or_send
 * @module templates/safe-edit-or-send/safe-edit-or-send.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров safe_edit_or_send */
export const safeEditOrSendParamsSchema = z.object({
  hasInlineButtonsOrSpecialNodes: z.boolean().optional().default(false),
  hasAutoTransitions: z.boolean().optional().default(false),
});

/** Тип параметров (выведен из схемы) */
export type SafeEditOrSendParams = z.infer<typeof safeEditOrSendParamsSchema>;

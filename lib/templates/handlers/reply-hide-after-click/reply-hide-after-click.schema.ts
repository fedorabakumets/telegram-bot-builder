/**
 * @fileoverview Zod схема для валидации параметров reply-hide-after-click
 * @module templates/handlers/reply-hide-after-click/reply-hide-after-click.schema
 */

import { z } from 'zod';

/** Схема параметров для генерации кода обработки hideAfterClick */
export const replyHideAfterClickParamsSchema = z.object({
  nodes: z.array(z.any()),
  indentLevel: z.string().optional().default('    '),
});

export type ReplyHideAfterClickParams = z.infer<typeof replyHideAfterClickParamsSchema>;

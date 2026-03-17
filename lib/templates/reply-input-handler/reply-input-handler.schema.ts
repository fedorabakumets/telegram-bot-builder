/**
 * @fileoverview Zod схема для шаблона обработки reply-ввода
 * @module templates/reply-input-handler/reply-input-handler.schema
 */

import { z } from 'zod';

const commandNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  command: z.string(),
});

const graphNodeSchema = z.object({
  id: z.string(),
  safeName: z.string(),
});

export const replyInputHandlerParamsSchema = z.object({
  nodes: z.array(graphNodeSchema),
  commandNodes: z.array(commandNodeSchema),
  hasUrlButtons: z.boolean(),
  indentLevel: z.string().optional(),
});

export type ReplyInputHandlerParams = z.infer<typeof replyInputHandlerParamsSchema>;

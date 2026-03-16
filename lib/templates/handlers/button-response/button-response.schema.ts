/**
 * @fileoverview Zod схема для валидации параметров button-response обработчика
 * @module templates/handlers/button-response/button-response.schema
 */

import { z } from 'zod';

/** Схема для опции ответа */
const responseOptionSchema = z.object({
  text: z.string(),
  value: z.string().optional(),
  action: z.string().optional(),
  target: z.string().optional(),
  url: z.string().optional(),
});

/** Схема для узла с кнопочным вводом */
const userInputNodeSchema = z.object({
  id: z.string(),
  responseOptions: z.array(responseOptionSchema),
  allowSkip: z.boolean().optional(),
});

/** Схема для валидации параметров button-response */
export const buttonResponseParamsSchema = z.object({
  userInputNodes: z.array(userInputNodeSchema),
  allNodes: z.array(z.any()),
  hasUrlButtonsInProject: z.boolean().optional().default(false),
  indentLevel: z.string().optional().default(''),
});

export type ButtonResponseParams = z.infer<typeof buttonResponseParamsSchema>;

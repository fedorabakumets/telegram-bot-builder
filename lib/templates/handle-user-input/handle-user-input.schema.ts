/**
 * @fileoverview Zod схема для валидации параметров runtime-обработки пользовательского ввода
 * @module templates/handle-user-input/handle-user-input.schema
 */

import { z } from 'zod';

const buttonDataSchema = z.object({
  id: z.string().optional(),
  text: z.string(),
  action: z.string().optional(),
  target: z.string().optional(),
  url: z.string().optional(),
  hideAfterClick: z.boolean().optional(),
  skipDataCollection: z.boolean().optional(),
});

const nodeDataSchema = z.object({
  messageText: z.string().optional(),
  command: z.string().optional(),
  buttons: z.array(buttonDataSchema).optional(),
  keyboardType: z.string().optional(),
  keyboardLayout: z.any().optional(),
  resizeKeyboard: z.boolean().optional(),
  oneTimeKeyboard: z.boolean().optional(),
  allowMultipleSelection: z.boolean().optional(),
  multiSelectVariable: z.string().optional(),
  continueButtonText: z.string().optional(),
  continueButtonTarget: z.string().optional(),
  hideAfterClick: z.boolean().optional(),
  enableConditionalMessages: z.boolean().optional(),
  conditionalMessages: z.array(z.any()).optional(),
  collectUserInput: z.boolean().optional(),
  autoTransition: z.boolean().optional(),
  autoTransitionTarget: z.string().optional(),
  variableFilters: z.record(z.any()).optional(),
}).passthrough();

const nodeItemSchema = z.object({
  id: z.string(),
  safeName: z.string(),
  type: z.string(),
  data: nodeDataSchema,
});

export const handleUserInputParamsSchema = z.object({
  indentLevel: z.string().optional(),
  nodes: z.array(nodeItemSchema).optional().default([]),
  allNodeIds: z.array(z.string()).optional().default([]),
  hasUrlButtons: z.boolean().optional().default(false),
  hasSkipDataCollectionButtons: z.boolean().optional(),
  commandNodes: z.array(nodeItemSchema).optional().default([]),
});

export type HandleUserInputParams = z.infer<typeof handleUserInputParamsSchema>;

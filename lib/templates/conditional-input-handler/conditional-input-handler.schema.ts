/**
 * @fileoverview Zod схема для шаблона обработчика условного ввода
 * @module templates/conditional-input-handler/conditional-input-handler.schema
 */

import { z } from 'zod';

const nodeButtonSchema = z.object({
  id: z.string(),
  text: z.string(),
  action: z.string(),
  target: z.string().optional(),
  url: z.string().optional(),
  skipDataCollection: z.boolean().optional(),
  requestLocation: z.boolean().optional(),
});

const conditionalMessageSchema = z.object({
  variableName: z.string().optional(),
  variableNames: z.array(z.string()).optional(),
  logicOperator: z.string().optional(),
  condition: z.string(),
  messageText: z.string().optional(),
  priority: z.number().optional(),
  waitForTextInput: z.boolean().optional(),
  textInputVariable: z.string().optional(),
  nextNodeAfterInput: z.string().optional(),
  buttons: z.array(nodeButtonSchema).optional(),
  oneTimeKeyboard: z.boolean().optional(),
});

const nodeDataSchema = z.object({
  messageText: z.string().optional(),
  keyboardType: z.string().optional(),
  buttons: z.array(nodeButtonSchema).optional(),
  resizeKeyboard: z.boolean().optional(),
  oneTimeKeyboard: z.boolean().optional(),
  collectUserInput: z.boolean().optional(),
  allowMultipleSelection: z.boolean().optional(),
  multiSelectVariable: z.string().optional(),
  enableConditionalMessages: z.boolean().optional(),
  conditionalMessages: z.array(conditionalMessageSchema).optional(),
  inputVariable: z.string().optional(),
  inputTargetNodeId: z.string().optional(),
  enableTextInput: z.boolean().optional(),
  continueButtonText: z.string().optional(),
  continueButtonTarget: z.string().optional(),
});

const conditionalNavNodeSchema = z.object({
  id: z.string(),
  safeName: z.string(),
  type: z.string(),
  data: nodeDataSchema,
});

export const conditionalInputHandlerParamsSchema = z.object({
  nodes: z.array(conditionalNavNodeSchema),
  allNodeIds: z.array(z.string()),
  indentLevel: z.string().optional(),
  hasSkipDataCollectionButtons: z.boolean().optional(),
});

export type ConditionalInputHandlerParams = z.infer<typeof conditionalInputHandlerParamsSchema>;

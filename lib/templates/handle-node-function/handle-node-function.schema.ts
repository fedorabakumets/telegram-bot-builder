/**
 * @fileoverview Zod схема для валидации параметров handle_node_* функций
 * @module templates/handle-node-function/handle-node-function.schema
 */

import { z } from 'zod';

const conditionalMessageSchema = z.object({
  variableName: z.string().optional(),
  variableNames: z.array(z.string()).optional(),
  logicOperator: z.enum(['AND', 'OR']).optional().default('AND'),
  condition: z.string().optional(),
  messageText: z.string().optional().default(''),
  priority: z.number().optional().default(0),
});

export const handleNodeFunctionParamsSchema = z.object({
  nodeId: z.string(),
  safeName: z.string(),
  messageText: z.string().optional().default(''),
  formatMode: z.string().optional().default('none'),
  imageUrl: z.string().optional().default(''),
  attachedMedia: z.array(z.string()).optional().default([]),
  enableConditionalMessages: z.boolean().optional().default(false),
  conditionalMessages: z.array(conditionalMessageSchema).optional().default([]),
  variableFiltersJson: z.string().optional().default('{}'),
  enableAutoTransition: z.boolean().optional().default(false),
  autoTransitionTo: z.string().optional().default(''),
  collectUserInput: z.boolean().optional().default(false),
  inputType: z.string().optional().default('text'),
  inputTargetNodeId: z.string().optional().default(''),
  usedVariables: z.array(z.string()).optional().default([]),
});

export const handleNodeFunctionsParamsSchema = z.object({
  nodes: z.array(handleNodeFunctionParamsSchema),
});

export type HandleNodeFunctionSchemaParams = z.infer<typeof handleNodeFunctionParamsSchema>;
export type HandleNodeFunctionsSchemaParams = z.infer<typeof handleNodeFunctionsParamsSchema>;

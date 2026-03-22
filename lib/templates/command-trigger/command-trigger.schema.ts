/**
 * @fileoverview Zod схема для валидации параметров командных триггеров
 * @module templates/command-trigger/command-trigger.schema
 */

import { z } from 'zod';

export const commandTriggerEntrySchema = z.object({
  nodeId: z.string().min(1),
  command: z.string().min(1),
  description: z.string().optional(),
  showInMenu: z.boolean().optional(),
  isPrivateOnly: z.boolean().optional(),
  adminOnly: z.boolean().optional(),
  requiresAuth: z.boolean().optional(),
  targetNodeId: z.string().min(1),
  targetNodeType: z.string().min(1),
});

export const commandTriggerParamsSchema = z.object({
  entries: z.array(commandTriggerEntrySchema),
});

export type CommandTriggerParams = z.infer<typeof commandTriggerParamsSchema>;

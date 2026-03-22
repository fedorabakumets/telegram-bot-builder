/**
 * @fileoverview Zod схема для валидации параметров командных триггеров
 * @module templates/command-trigger/command-trigger.schema
 */

import { z } from 'zod';

/** Zod схема одного командного триггера */
export const commandTriggerEntrySchema = z.object({
  nodeId: z.string().min(1),
  command: z.string().min(1),
  description: z.string().optional(),
  showInMenu: z.boolean().optional(),
  isPrivateOnly: z.boolean().optional(),
  targetNodeId: z.string().min(1),
  targetNodeType: z.string().min(1),
});

/** Zod схема параметров шаблона */
export const commandTriggerParamsSchema = z.object({
  entries: z.array(commandTriggerEntrySchema),
});

/** Тип параметров из схемы */
export type CommandTriggerParams = z.infer<typeof commandTriggerParamsSchema>;

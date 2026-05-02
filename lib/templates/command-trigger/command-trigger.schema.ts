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
  adminOnly: z.boolean().optional(),
  requiresAuth: z.boolean().optional(),
  targetNodeId: z.string().min(1),
  targetNodeType: z.string().min(1),
  /** Режим совпадения deep link параметра: точное или по префиксу */
  deepLinkMatchMode: z.enum(['exact', 'startsWith']).optional(),
  /** Параметр deep link, например "ref" или "ref_" */
  deepLinkParam: z.string().optional(),
  /** Сохранять значение параметра в переменную пользователя */
  deepLinkSaveToVar: z.boolean().optional(),
  /** Имя переменной для сохранения значения deep link */
  deepLinkVarName: z.string().optional(),
});

export const commandTriggerParamsSchema = z.object({
  entries: z.array(commandTriggerEntrySchema),
});

export type CommandTriggerParams = z.infer<typeof commandTriggerParamsSchema>;

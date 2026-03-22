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
  /** Только приватные чаты */
  isPrivateOnly: z.boolean().optional(),
  /** Только для администраторов */
  adminOnly: z.boolean().optional(),
  /** Требуется авторизация пользователя */
  requiresAuth: z.boolean().optional(),
  synonyms: z.array(z.string()).optional().default([]),
  targetNodeId: z.string().min(1),
  targetNodeType: z.string().min(1),
  /** Текст сообщения */
  messageText: z.string().optional().default(''),
  /** Режим форматирования */
  formatMode: z.enum(['html', 'markdown', 'none']).optional().default('none'),
  /** Содержит ли текст переменные */
  hasVariables: z.boolean().optional().default(false),
});

/** Zod схема параметров шаблона */
export const commandTriggerParamsSchema = z.object({
  entries: z.array(commandTriggerEntrySchema),
});

/** Тип параметров из схемы */
export type CommandTriggerParams = z.infer<typeof commandTriggerParamsSchema>;

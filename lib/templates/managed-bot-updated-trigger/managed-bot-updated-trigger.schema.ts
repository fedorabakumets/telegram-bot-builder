/**
 * @fileoverview Zod схема для валидации параметров триггеров обновления управляемого бота
 * @module templates/managed-bot-updated-trigger/managed-bot-updated-trigger.schema
 */

import { z } from 'zod';

/**
 * Схема одного триггера обновления управляемого бота.
 * Поля nodeId, targetNodeId, targetNodeType — обязательные.
 * Остальные поля — опциональные.
 */
const managedBotUpdatedTriggerEntrySchema = z.object({
  /** ID узла managed_bot_updated_trigger */
  nodeId: z.string(),
  /** ID целевого узла */
  targetNodeId: z.string(),
  /** Тип целевого узла */
  targetNodeType: z.string(),
  /** Переменная для сохранения bot.id */
  saveBotIdTo: z.string().optional(),
  /** Переменная для сохранения bot.username */
  saveBotUsernameTo: z.string().optional(),
  /** Переменная для сохранения bot.first_name */
  saveBotNameTo: z.string().optional(),
  /** Переменная для сохранения user.id создателя */
  saveCreatorIdTo: z.string().optional(),
  /** Переменная для сохранения user.username создателя */
  saveCreatorUsernameTo: z.string().optional(),
  /** Фильтр по user.id — если задан, реагирует только на этого пользователя */
  filterByUserId: z.string().optional(),
});

/**
 * Схема параметров шаблона триггеров обновления управляемого бота
 */
export const managedBotUpdatedTriggerParamsSchema = z.object({
  /** Массив триггеров обновления управляемого бота */
  entries: z.array(managedBotUpdatedTriggerEntrySchema),
});

export type ManagedBotUpdatedTriggerParams = z.infer<typeof managedBotUpdatedTriggerParamsSchema>;

/**
 * @fileoverview Zod схема для валидации параметров узла получения токена управляемого бота
 * @module templates/get-managed-bot-token/get-managed-bot-token.schema
 */

import { z } from 'zod';

/**
 * Схема одного узла get_managed_bot_token.
 * Поля nodeId, targetNodeId, targetNodeType — обязательные.
 * Остальные поля — опциональные.
 */
const getManagedBotTokenEntrySchema = z.object({
  /** ID узла get_managed_bot_token */
  nodeId: z.string(),
  /** ID целевого узла для перехода */
  targetNodeId: z.string(),
  /** Тип целевого узла */
  targetNodeType: z.string(),
  /** Источник bot_id: 'variable' или 'manual' */
  botIdSource: z.string().optional(),
  /** Имя переменной с bot_id */
  botIdVariable: z.string().optional(),
  /** Ручной числовой ID бота */
  botIdManual: z.string().optional(),
  /** Переменная для сохранения токена */
  saveTokenTo: z.string().optional(),
  /** Переменная для сохранения ошибки */
  saveErrorTo: z.string().optional(),
});

/**
 * Схема параметров шаблона узла получения токена управляемого бота
 */
export const getManagedBotTokenParamsSchema = z.object({
  /** Массив записей узлов get_managed_bot_token */
  entries: z.array(getManagedBotTokenEntrySchema),
});

export type GetManagedBotTokenParams = z.infer<typeof getManagedBotTokenParamsSchema>;

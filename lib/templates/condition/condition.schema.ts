/**
 * @fileoverview Zod-схема для валидации параметров узлов условия
 * @module templates/condition/condition.schema
 */

import { z } from 'zod';

/** Zod-схема одной ветки условия */
export const conditionBranchEntrySchema = z.object({
  /** Уникальный идентификатор ветки */
  id: z.string(),
  /** Оператор ветки */
  operator: z.enum(['filled', 'empty', 'equals', 'contains', 'greater_than', 'less_than', 'between', 'is_private', 'is_group', 'is_channel', 'is_admin', 'is_premium', 'is_bot', 'is_subscribed', 'is_not_subscribed', 'else']),
  /** Значение для сравнения (для оператора "equals") */
  value: z.string(),
  /** Второе значение для оператора "between" */
  value2: z.string().optional(),
  /** ID целевого узла */
  target: z.string().optional(),
  /** Режим проверки нескольких каналов: "all" — все, "any" — хотя бы один */
  subscriptionMode: z.enum(['all', 'any']).optional(),
});

/** Zod-схема одного узла условия */
export const conditionEntrySchema = z.object({
  /** ID узла condition */
  nodeId: z.string().min(1),
  /** Переменная для проверки (может быть пустой для системных операторов) */
  variable: z.string(),
  /** Ветки условия */
  branches: z.array(conditionBranchEntrySchema).min(1),
});

/** Zod-схема параметров шаблона */
export const conditionParamsSchema = z.object({
  entries: z.array(conditionEntrySchema),
});

/** Тип параметров из схемы */
export type ConditionParams = z.infer<typeof conditionParamsSchema>;

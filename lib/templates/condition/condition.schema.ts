/**
 * @fileoverview Zod-схема для валидации параметров узлов условия
 * @module templates/condition/condition.schema
 */

import { z } from 'zod';
import { CONDITION_OPERATOR_VALUES } from '@shared/schema/tables/condition-branch-schema';

/** Zod-схема одной ветки условия */
export const conditionBranchEntrySchema = z.object({
  /** Уникальный идентификатор ветки */
  id: z.string(),
  /** Оператор ветки */
  operator: z.enum(CONDITION_OPERATOR_VALUES),
  /** Значение для сравнения (для оператора "equals") */
  value: z.string(),
  /** Второе значение для оператора "between" */
  value2: z.string().optional(),
  /** Значение для оператора "matches_regex" (raw-строка) */
  valueRegex: z.string().optional(),
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

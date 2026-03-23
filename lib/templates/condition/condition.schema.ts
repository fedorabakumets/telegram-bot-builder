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
  operator: z.enum(['filled', 'empty', 'equals', 'contains', 'else']),
  /** Значение для сравнения (для оператора "equals") */
  value: z.string(),
  /** ID целевого узла */
  target: z.string().optional(),
});

/** Zod-схема одного узла условия */
export const conditionEntrySchema = z.object({
  /** ID узла condition */
  nodeId: z.string().min(1),
  /** Переменная для проверки */
  variable: z.string().min(1),
  /** Ветки условия */
  branches: z.array(conditionBranchEntrySchema).min(1),
});

/** Zod-схема параметров шаблона */
export const conditionParamsSchema = z.object({
  entries: z.array(conditionEntrySchema),
});

/** Тип параметров из схемы */
export type ConditionParams = z.infer<typeof conditionParamsSchema>;

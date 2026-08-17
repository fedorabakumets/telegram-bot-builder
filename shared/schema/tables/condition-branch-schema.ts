/**
 * @fileoverview Zod-схема ветки condition-ноды
 * @module shared/schema/tables/condition-branch-schema
 */

import { z } from "zod";

/** Операторы condition-ноды (AGENTS.md + шаблон condition) */
export const CONDITION_OPERATOR_VALUES = [
  'filled',
  'empty',
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'starts_with',
  'ends_with',
  'matches_regex',
  'greater_than',
  'less_than',
  'between',
  'is_even',
  'is_odd',
  'divisible_by',
  'else',
  'is_private',
  'is_group',
  'is_channel',
  'is_admin',
  'is_premium',
  'is_bot',
  'is_subscribed',
  'is_not_subscribed',
] as const;

/** Схема одной ветки условия */
export const conditionBranchSchema = z.object({
  /** Уникальный идентификатор ветки */
  id: z.string(),
  /** Подпись ветки на холсте (в легаси-проектах часто отсутствует) */
  label: z.string().optional().default(''),
  /** Оператор сравнения */
  operator: z.enum(CONDITION_OPERATOR_VALUES),
  /** Значение для сравнения */
  value: z.string(),
  /** Второе значение для оператора between */
  value2: z.string().optional(),
  /** Регулярное выражение для matches_regex */
  valueRegex: z.string().optional(),
  /** ID целевого узла */
  target: z.string().optional(),
  /** Режим проверки подписки: all — все каналы, any — хотя бы один */
  subscriptionMode: z.enum(['all', 'any']).optional(),
});

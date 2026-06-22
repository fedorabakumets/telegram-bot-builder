/**
 * @fileoverview Константы introspection-слоя инструментов конструктора
 * @module lib/bot-tools/constants
 */

import { z } from 'zod';
import { nodeSchema } from '@shared/schema/tables/node-schema';

/** Все допустимые типы нод из zod-схемы */
export const NODE_TYPES = nodeSchema.shape.type._def.values as readonly string[];

/** Операторы condition-ноды — белый список (AGENTS.md + shared/types/condition-node.ts) */
export const CONDITION_OPERATORS = [
  'filled', 'empty', 'equals', 'not_equals', 'contains', 'not_contains',
  'starts_with', 'ends_with', 'matches_regex', 'greater_than', 'less_than',
  'between', 'is_even', 'is_odd', 'divisible_by', 'else',
  'is_private', 'is_group', 'is_channel', 'is_admin', 'is_premium',
  'is_bot', 'is_subscribed', 'is_not_subscribed',
] as const;

/**
 * Снимает обёртку ZodDefault (например branches: z.array(...).default([]))
 * @param schema - Zod-схема, возможно с .default()
 * @returns Внутренняя схема без default
 */
function unwrapZodDefault(schema: z.ZodTypeAny): z.ZodTypeAny {
  return schema instanceof z.ZodDefault ? schema._def.innerType : schema;
}

/**
 * Извлекает enum операторов из zod-схемы branches в node-schema
 * @returns ZodEnum операторов или null
 */
function getBranchOperatorEnum(): z.ZodEnum<[string, ...string[]]> | null {
  const branches = unwrapZodDefault(nodeSchema.shape.data.shape.branches);
  if (!(branches instanceof z.ZodArray)) return null;
  const branchObj = branches.element;
  if (!(branchObj instanceof z.ZodObject)) return null;
  const operator = branchObj.shape.operator;
  return operator instanceof z.ZodEnum ? operator : null;
}

/** Операторы, принятые zod-схемой node-schema (может быть уже полного списка) */
export const ZOD_CONDITION_OPERATORS = (getBranchOperatorEnum()?._def.values ?? []) as readonly string[];

/**
 * @fileoverview Константы introspection-слоя инструментов конструктора
 * @module lib/bot-tools/constants
 */

import { CONDITION_OPERATOR_VALUES, conditionBranchSchema } from '@shared/schema/tables/condition-branch-schema';
import { nodeSchema } from '@shared/schema/tables/node-schema';

/** Все допустимые типы нод из zod-схемы */
export const NODE_TYPES: readonly string[] = nodeSchema.shape.type.options;

/** Операторы condition-ноды — тот же список, что в zod-схеме ветки */
export const CONDITION_OPERATORS = CONDITION_OPERATOR_VALUES;

/**
 * Операторы из общей схемы ветки, которую использует node-schema.
 * Прямой доступ не зависит от различий API обёртки default в Zod 3 и Zod 4.
 */
export const ZOD_CONDITION_OPERATORS: readonly string[] = conditionBranchSchema.shape.operator.options;

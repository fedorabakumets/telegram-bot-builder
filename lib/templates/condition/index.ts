/**
 * @fileoverview Экспорт модуля обработчиков узлов условия
 * @module templates/condition/index
 */

export type { ConditionBranchEntry, ConditionEntry, ConditionTemplateParams } from './condition.params';
export type { ConditionParams } from './condition.schema';
export { conditionParamsSchema, conditionEntrySchema, conditionBranchEntrySchema } from './condition.schema';
export {
  collectConditionEntries,
  generateConditionHandlers,
} from './condition.renderer';
export * from './condition.fixture';

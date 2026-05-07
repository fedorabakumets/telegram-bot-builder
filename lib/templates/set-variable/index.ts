/**
 * @fileoverview Экспорт модуля шаблона узла set_variable
 * @module templates/set-variable/index
 */

export type { SetVariableAssignment, SetVariableTemplateParams } from './set-variable.params';
export type { SetVariableParams } from './set-variable.schema';
export { setVariableParamsSchema } from './set-variable.schema';
export {
  collectSetVariableEntries,
  generateSetVariableHandlers,
} from './set-variable.renderer';
export * from './set-variable.fixture';

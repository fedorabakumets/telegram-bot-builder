/**
 * @fileoverview Экспорт модуля шаблона get_user_variables
 * @module templates/user-variables-func/index
 */

export { generateGetUserVariablesFunction } from './user-variables-func.renderer';
export type { UserVariablesFuncTemplateParams } from './user-variables-func.params';
export type { UserVariablesFuncParams } from './user-variables-func.schema';
export { userVariablesFuncParamsSchema } from './user-variables-func.schema';
export * from './user-variables-func.fixture';

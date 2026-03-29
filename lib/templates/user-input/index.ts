/**
 * @fileoverview Экспорт модуля сбора пользовательского ввода
 * @module templates/user-input/index
 */

export type { UserInputTemplateParams, InputValidationType, InputSource, InputType } from './user-input.params';
export type { UserInputParams } from './user-input.schema';
export { userInputParamsSchema } from './user-input.schema';
export { generateUserInput, generateUserInputFromNode, generateUserInputNodeHandler, nodeToUserInputParams, nodeHasUserInput } from './user-input.renderer';
export * from './user-input.fixture';

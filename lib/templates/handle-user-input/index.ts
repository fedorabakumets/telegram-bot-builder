/**
 * @fileoverview Экспорт модуля runtime-обработки пользовательского ввода
 * @module templates/handle-user-input/index
 */

export type { HandleUserInputTemplateParams } from './handle-user-input.params';
export type { HandleUserInputParams } from './handle-user-input.schema';
export { handleUserInputParamsSchema } from './handle-user-input.schema';
export { generateHandleUserInput } from './handle-user-input.renderer';
export * from './handle-user-input.fixture';

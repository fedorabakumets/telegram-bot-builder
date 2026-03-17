/**
 * @fileoverview Бочка для шаблона callback-handler-init
 * @module templates/callback-handler-init
 */

export {
  generateCallbackHandlerInit,
  buildCallbackHandlerInitParams,
} from './callback-handler-init.renderer';
export { callbackHandlerInitParamsSchema } from './callback-handler-init.schema';
export type { CallbackHandlerInitTemplateParams } from './callback-handler-init.params';
export type { CallbackHandlerInitParams } from './callback-handler-init.schema';
export * from './callback-handler-init.fixture';

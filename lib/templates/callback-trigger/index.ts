/**
 * @fileoverview Экспорт модуля обработчиков триггеров inline-кнопок
 * @module templates/callback-trigger/index
 */

export type { CallbackTriggerEntry, CallbackTriggerTemplateParams } from './callback-trigger.params';
export type { CallbackTriggerParams } from './callback-trigger.schema';
export { callbackTriggerParamsSchema } from './callback-trigger.schema';
export {
  collectCallbackTriggerEntries,
  generateCallbackTriggers,
  generateCallbackTriggerHandlers,
} from './callback-trigger.renderer';
export * from './callback-trigger.fixture';

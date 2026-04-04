/**
 * @fileoverview Экспорт модуля middleware триггеров входящих callback_query
 * @module templates/incoming-callback-trigger/index
 */

export type { IncomingCallbackTriggerEntry, IncomingCallbackTriggerTemplateParams } from './incoming-callback-trigger.params';
export type { IncomingCallbackTriggerParams } from './incoming-callback-trigger.schema';
export { incomingCallbackTriggerParamsSchema } from './incoming-callback-trigger.schema';
export {
  collectIncomingCallbackTriggerEntries,
  generateIncomingCallbackTriggers,
  generateIncomingCallbackTriggerHandlers,
} from './incoming-callback-trigger.renderer';
export * from './incoming-callback-trigger.fixture';

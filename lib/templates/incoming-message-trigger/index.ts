/**
 * @fileoverview Экспорт модуля middleware триггеров входящих сообщений
 * @module templates/incoming-message-trigger/index
 */

export type { IncomingMessageTriggerEntry, IncomingMessageTriggerTemplateParams } from './incoming-message-trigger.params';
export type { IncomingMessageTriggerParams } from './incoming-message-trigger.schema';
export { incomingMessageTriggerParamsSchema } from './incoming-message-trigger.schema';
export {
  collectIncomingMessageTriggerEntries,
  generateIncomingMessageTriggers,
  generateIncomingMessageTriggerHandlers,
} from './incoming-message-trigger.renderer';
export * from './incoming-message-trigger.fixture';

/**
 * @fileoverview Экспорт модуля обработчиков триггеров исходящих сообщений
 * @module templates/outgoing-message-trigger/index
 */

export type { OutgoingMessageTriggerEntry, OutgoingMessageTriggerTemplateParams } from './outgoing-message-trigger.params';
export type { OutgoingMessageTriggerParams } from './outgoing-message-trigger.schema';
export { outgoingMessageTriggerParamsSchema } from './outgoing-message-trigger.schema';
export {
  collectOutgoingMessageTriggerEntries,
  generateOutgoingMessageTriggers,
  generateOutgoingMessageTriggerHandlers,
} from './outgoing-message-trigger.renderer';
export * from './outgoing-message-trigger.fixture';

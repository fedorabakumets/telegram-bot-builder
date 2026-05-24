/**
 * @fileoverview Экспорт модуля шаблона delete_message
 * @module templates/delete-message/index
 */

export type { DeleteMessageEntry, DeleteMessageTemplateParams, DeleteMessageIdSource, DeleteMessageChatIdSource } from './delete-message.params';
export type { DeleteMessageParams } from './delete-message.schema';
export { deleteMessageParamsSchema, deleteMessageIdSourceSchema, deleteMessageChatIdSourceSchema } from './delete-message.schema';
export {
  collectDeleteMessageEntries,
  generateDeleteMessage,
  generateDeleteMessageHandlers,
} from './delete-message.renderer';
export * from './delete-message.fixture';

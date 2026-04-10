/**
 * @fileoverview Экспорт модуля обработчиков узла edit_message
 * @module templates/edit-message/index
 */

export type { EditMessageEntry, EditMessageTemplateParams } from './edit-message.params';
export type { EditMessageParams } from './edit-message.schema';
export { editMessageParamsSchema } from './edit-message.schema';
export {
  collectEditMessageEntries,
  generateEditMessage,
  generateEditMessageHandlers,
} from './edit-message.renderer';
export * from './edit-message.fixture';

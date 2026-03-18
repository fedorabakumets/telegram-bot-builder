/**
 * @fileoverview Экспорт модуля обработчиков управления сообщениями
 * @module templates/message-handler/index
 */

export type { MessageHandlerTemplateParams, MessageHandlerNodeType } from './message-handler.params';
export type { MessageHandlerParams } from './message-handler.schema';
export { messageHandlerParamsSchema, messageHandlerNodeTypeSchema } from './message-handler.schema';
export { generateMessageHandler, generateMessageHandlerFromNode, nodeToMessageHandlerParams } from './message-handler.renderer';
export * from './message-handler.fixture';

/**
 * @fileoverview Экспорт модуля шаблона пересылки сообщения
 * @module templates/forward-message/index
 */

export type {
  ForwardMessageTemplateParams,
  ForwardMessageTargetRecipient,
  ForwardMessageSourceMode,
  ForwardMessageTargetMode,
} from './forward-message.params';
export type { ForwardMessageParams } from './forward-message.schema';
export {
  forwardMessageParamsSchema,
  forwardMessageSourceModeSchema,
  forwardMessageTargetModeSchema,
  forwardMessageTargetRecipientSchema,
} from './forward-message.schema';
export {
  generateForwardMessage,
  generateForwardMessageFromNode,
  nodeToForwardMessageParams,
} from './forward-message.renderer';
export * from './forward-message.fixture';

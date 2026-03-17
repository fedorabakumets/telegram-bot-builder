/**
 * @fileoverview Бочка для шаблона conditional-messages
 * @module templates/conditional-messages
 */

export { generateConditionalMessages } from './conditional-messages.renderer';
export { conditionalMessagesParamsSchema } from './conditional-messages.schema';
export type { ConditionalMessagesTemplateParams, ConditionalMessage } from './conditional-messages.params';
export type { ConditionalMessagesParams } from './conditional-messages.schema';
export * from './conditional-messages.fixture';

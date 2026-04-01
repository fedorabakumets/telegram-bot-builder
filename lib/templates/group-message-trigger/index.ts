/**
 * @fileoverview Экспорт модуля шаблона триггера сообщения в топике форум-группы
 * @module templates/group-message-trigger/index
 */

export type {
  GroupChatIdSource,
  GroupMessageTriggerEntry,
  GroupMessageTriggerTemplateParams,
} from './group-message-trigger.params';
export type { GroupMessageTriggerParams } from './group-message-trigger.schema';
export {
  groupChatIdSourceSchema,
  groupMessageTriggerParamsSchema,
} from './group-message-trigger.schema';
export {
  collectGroupMessageTriggerEntries,
  generateGroupMessageTriggers,
  generateGroupMessageTriggerHandlers,
} from './group-message-trigger.renderer';
export * from './group-message-trigger.fixture';

/**
 * @fileoverview Экспорт модуля обработчиков триггера участника
 * @module templates/member-trigger/index
 */

export type {
  MemberEventType,
  MemberGroupChatIdSource,
  MemberTriggerEntry,
  MemberTriggerTemplateParams,
} from './member-trigger.params';
export type { MemberTriggerParams } from './member-trigger.schema';
export { memberTriggerParamsSchema } from './member-trigger.schema';
export {
  collectMemberTriggerEntries,
  generateMemberTriggers,
  generateMemberTriggerHandlers,
} from './member-trigger.renderer';
export * from './member-trigger.fixture';

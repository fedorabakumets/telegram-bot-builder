/**
 * @fileoverview Экспорт модуля обработчиков триггеров обновления управляемого бота
 * @module templates/managed-bot-updated-trigger/index
 */

export type { ManagedBotUpdatedTriggerEntry, ManagedBotUpdatedTriggerTemplateParams } from './managed-bot-updated-trigger.params';
export type { ManagedBotUpdatedTriggerParams } from './managed-bot-updated-trigger.schema';
export { managedBotUpdatedTriggerParamsSchema } from './managed-bot-updated-trigger.schema';
export {
  collectManagedBotUpdatedTriggerEntries,
  generateManagedBotUpdatedTriggers,
  generateManagedBotUpdatedTriggerHandlers,
} from './managed-bot-updated-trigger.renderer';
export * from './managed-bot-updated-trigger.fixture';

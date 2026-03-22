/**
 * @fileoverview Экспорт модуля обработчиков командных триггеров
 * @module templates/command-trigger/index
 */

export type { CommandTriggerEntry, CommandTriggerTemplateParams } from './command-trigger.params';
export type { CommandTriggerParams } from './command-trigger.schema';
export { commandTriggerParamsSchema } from './command-trigger.schema';
export {
  collectCommandTriggerEntries,
  generateCommandTriggers,
  generateCommandTriggerHandlers,
} from './command-trigger.renderer';
export * from './command-trigger.fixture';

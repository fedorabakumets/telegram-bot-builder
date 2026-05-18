/**
 * @fileoverview Экспорт модуля шаблона узла bot_table
 * @module templates/bot-table
 */

export type { BotTableEntry, BotTableTemplateParams, BotTableWhereCondition, BotTableUpdateEntry } from './bot-table.params';
export type { BotTableEntryValidated } from './bot-table.schema';
export { botTableEntrySchema } from './bot-table.schema';
export {
  collectBotTableEntries,
  generateBotTableHandlers,
} from './bot-table.renderer';
export * from './bot-table.fixture';

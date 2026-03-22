/**
 * @fileoverview Экспорт модуля обработчиков текстовых триггеров
 * @module templates/text-trigger/index
 */

export type { TextTriggerEntry, TextTriggerTemplateParams } from './text-trigger.params';
export type { TextTriggerParams } from './text-trigger.schema';
export { textTriggerParamsSchema } from './text-trigger.schema';
export {
  collectTextTriggerEntries,
  generateTextTriggers,
  generateTextTriggerHandlers,
} from './text-trigger.renderer';
export * from './text-trigger.fixture';

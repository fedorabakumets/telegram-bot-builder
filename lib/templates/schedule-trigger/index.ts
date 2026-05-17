/**
 * @fileoverview Экспорт модуля schedule_trigger
 * @module templates/schedule-trigger/index
 */

export type { ScheduleRule, ScheduleTriggerEntry, ScheduleTriggerTemplateParams } from './schedule-trigger.params';
export type { ScheduleTriggerParams } from './schedule-trigger.schema';
export { scheduleTriggerParamsSchema } from './schedule-trigger.schema';
export {
  collectScheduleTriggerEntries,
  generateScheduleTrigger,
  generateScheduleTriggerHandlers,
} from './schedule-trigger.renderer';
export * from './schedule-trigger.fixture';

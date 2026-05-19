/**
 * @fileoverview Экспорт модуля delay
 * @module templates/delay/index
 */

export type { DelayEntry, DelayTemplateParams } from './delay.params';
export type { DelayParams } from './delay.schema';
export { delayParamsSchema } from './delay.schema';
export { collectDelayEntries, generateDelayHandlers } from './delay.renderer';

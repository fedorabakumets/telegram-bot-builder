/**
 * @fileoverview Экспорт модуля rate_counter
 * @module templates/rate-counter/index
 */

export {
  collectRateCounterEntries,
  generateRateCounter,
  generateRateCounterHandlers,
} from './rate-counter.renderer';
export type { RateCounterEntry, RateCounterTemplateParams } from './rate-counter.params';

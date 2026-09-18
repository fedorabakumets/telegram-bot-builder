/**
 * @fileoverview Экспорт модуля get_star_balance
 * @module templates/get-star-balance
 */

export type {
  GetStarBalanceEntry,
  GetStarBalanceTemplateParams,
} from './get-star-balance.params';
export type { GetStarBalanceParams } from './get-star-balance.schema';
export {
  getStarBalanceParamsSchema,
  getStarBalanceEntrySchema,
} from './get-star-balance.schema';
export {
  collectGetStarBalanceEntries,
  generateGetStarBalance,
  generateGetStarBalanceHandlers,
} from './get-star-balance.renderer';

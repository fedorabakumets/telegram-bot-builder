/**
 * @fileoverview Экспорт модуля refund_stars
 * @module templates/refund-stars
 */

export type { RefundStarsEntry, RefundStarsTemplateParams, RefundUserSource } from './refund-stars.params';
export type { RefundStarsParams } from './refund-stars.schema';
export { refundStarsParamsSchema, refundStarsEntrySchema, refundUserSourceSchema } from './refund-stars.schema';
export {
  collectRefundStarsEntries,
  generateRefundStars,
  generateRefundStarsHandlers,
} from './refund-stars.renderer';
export * from './refund-stars.fixture';

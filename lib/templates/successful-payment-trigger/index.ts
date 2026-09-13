/**
 * @fileoverview Экспорт модуля successful_payment_trigger
 * @module templates/successful-payment-trigger
 */

export type {
  SuccessfulPaymentPayloadFilter,
  SuccessfulPaymentTriggerEntry,
  SuccessfulPaymentTriggerTemplateParams,
} from './successful-payment-trigger.params';
export type { SuccessfulPaymentTriggerParams } from './successful-payment-trigger.schema';
export { successfulPaymentTriggerParamsSchema } from './successful-payment-trigger.schema';
export {
  collectSuccessfulPaymentTriggerEntries,
  generateSuccessfulPaymentTriggerHandlers,
} from './successful-payment-trigger.renderer';
export * from './successful-payment-trigger.fixture';

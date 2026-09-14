/**
 * @fileoverview Экспорт модуля send_invoice
 * @module templates/send-invoice
 */

export type { SendInvoiceEntry, CreateInvoiceLinkEntry, SendInvoiceTemplateParams } from './send-invoice.params';
export type { SendInvoiceParams } from './send-invoice.schema';
export { sendInvoiceParamsSchema, sendInvoiceEntrySchema } from './send-invoice.schema';
export {
  collectSendInvoiceEntries,
  collectCreateInvoiceLinkEntries,
  generateSendInvoiceHandlers,
} from './send-invoice.renderer';

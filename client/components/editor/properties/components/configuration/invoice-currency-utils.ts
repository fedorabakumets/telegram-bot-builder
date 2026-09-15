/**
 * @fileoverview Нормализация и иконка валюты счёта (реэкспорт shared)
 * @module components/editor/properties/components/configuration/invoice-currency-utils
 */

import { normalizeInvoiceCurrency } from '@shared/invoice-currencies';

export {
  INVOICE_CURRENCIES,
  INVOICE_CURRENCY_OPTIONS,
  INVOICE_FIAT_CURRENCIES,
  isInvoiceCurrencyCode,
  normalizeInvoiceCurrency,
  type InvoiceCurrencyCode,
  type InvoiceCurrencyOption,
} from '@shared/invoice-currencies';

/**
 * Статически ли валюта = XTR (без {переменной})
 * @param raw - Сырое invoiceCurrency
 * @returns true если точно звёзды
 */
export function isStaticStarsCurrency(raw: unknown): boolean {
  const s = String(raw ?? 'XTR').trim();
  if (s.includes('{')) return false;
  return normalizeInvoiceCurrency(s) === 'XTR';
}

/**
 * Иконка Font Awesome по валюте счёта
 * @param rawCurrency - Сырое значение invoiceCurrency
 * @returns Класс иконки (например fas fa-star)
 */
export function invoiceCurrencyIconClass(rawCurrency: unknown): string {
  return isStaticStarsCurrency(rawCurrency) ? 'fas fa-star' : 'fas fa-receipt';
}

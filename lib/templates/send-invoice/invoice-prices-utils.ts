/**
 * @fileoverview Нормализация строк LabeledPrice из data узла счёта
 * @module templates/send-invoice/invoice-prices-utils
 */

/** Одна строка цены для шаблона */
export interface InvoicePriceLine {
  /** Подпись */
  label: string;
  /** Сумма (строка / переменная) */
  amount: string;
}

/**
 * Собирает prices из invoicePrices или fallback на invoiceAmount
 * @param data - Data узла
 * @param fallbackLabel - Label если одна строка из amount
 * @param starsOnlyOne - Для XTR оставить максимум одну строку
 * @returns Массив строк цены
 */
export function resolveInvoicePriceLines(
  data: any,
  fallbackLabel: string,
  starsOnlyOne: boolean,
): InvoicePriceLine[] {
  const raw = Array.isArray(data?.invoicePrices) ? data.invoicePrices : [];
  const lines: InvoicePriceLine[] = [];
  for (const row of raw) {
    const label = String(row?.label ?? '').trim();
    const amount = String(row?.amount ?? '').trim();
    if (!label && !amount) continue;
    lines.push({
      label: label || fallbackLabel || 'Item',
      amount: amount || '1',
    });
  }
  if (lines.length === 0) {
    lines.push({
      label: fallbackLabel || 'Item',
      amount: String(data?.invoiceAmount || '1'),
    });
  }
  if (starsOnlyOne && lines.length > 1) {
    return [lines[0]];
  }
  return lines;
}

/**
 * Парсит suggested tip amounts из строки "10,20,50"
 * @param raw - Сырая строка
 * @returns Массив положительных int
 */
export function parseSuggestedTipAmounts(raw: string): number[] {
  return String(raw || '')
    .split(/[,;\s]+/)
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
}

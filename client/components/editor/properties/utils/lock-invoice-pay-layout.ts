/**
 * @fileoverview Фиксация кнопки «Оплатить» в первой позиции раскладки счёта
 * @module components/editor/properties/utils/lock-invoice-pay-layout
 */

import type { KeyboardLayout } from '../types/keyboard-layout';

/**
 * Гарантирует, что кнопка оплаты — первая в первом ряду раскладки
 * @param layout - Текущая раскладка
 * @param payButtonId - ID кнопки с действием pay
 * @returns Раскладка с pay в начале
 */
export function lockInvoicePayInLayout(
  layout: KeyboardLayout,
  payButtonId: string,
): KeyboardLayout {
  if (!layout?.rows?.length || !payButtonId) return layout;

  const rows = layout.rows.map((row) => ({
    ...row,
    buttonIds: (row.buttonIds || []).filter((id) => id !== payButtonId),
  }));

  while (rows.length > 0 && rows[0].buttonIds.length === 0) {
    rows.shift();
  }

  if (rows.length === 0) {
    return {
      ...layout,
      rows: [{ buttonIds: [payButtonId] }],
      autoLayout: false,
    };
  }

  rows[0] = {
    ...rows[0],
    buttonIds: [payButtonId, ...rows[0].buttonIds],
  };

  return { ...layout, rows };
}

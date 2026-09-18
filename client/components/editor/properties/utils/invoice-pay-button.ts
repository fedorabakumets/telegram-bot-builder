/**
 * @fileoverview Утилиты кнопки «Оплатить» для клавиатуры счёта
 * @module components/editor/properties/utils/invoice-pay-button
 */

import type { Button } from '@shared/schema';
import { generateButtonId } from '@/utils/generate-button-id';

/** Текст кнопки оплаты по умолчанию */
export const DEFAULT_INVOICE_PAY_TEXT = 'Оплатить ⭐';

/**
 * Создаёт кнопку оплаты для клавиатуры счёта
 * @returns Новая кнопка с действием pay
 */
export function createInvoicePayButton(): Button {
  return {
    id: generateButtonId(),
    text: DEFAULT_INVOICE_PAY_TEXT,
    action: 'pay',
    buttonType: 'normal',
    skipDataCollection: true,
    hideAfterClick: false,
  } as Button;
}

/**
 * Гарантирует, что первая кнопка — «Оплатить»; лишние pay убирает из середины
 * @param buttons - Текущие кнопки клавиатуры
 * @returns Кнопки с pay первой
 */
export function ensureInvoicePayButton(buttons: Button[] | undefined): Button[] {
  const list = Array.isArray(buttons) ? [...buttons] : [];
  const payButtons = list.filter((b) => b.action === 'pay');
  const rest = list.filter((b) => b.action !== 'pay');
  const pay = payButtons[0] ?? createInvoicePayButton();
  return [pay, ...rest];
}

/**
 * Проверяет, привязана ли клавиатура к узлу счёта
 * @param keyboardNodeId - ID узла клавиатуры
 * @param allNodes - Узлы (из всех листов или текущего)
 * @returns true если есть send_invoice с этой клавиатурой
 */
export function isKeyboardBoundToInvoice(
  keyboardNodeId: string,
  allNodes: Array<{ node?: { id: string; type: string; data?: any }; id?: string; type?: string; data?: any }>,
): boolean {
  for (const item of allNodes) {
    const n = item.node ?? item;
    if ((n.type as string) === 'send_invoice' && n.data?.keyboardNodeId === keyboardNodeId) {
      return true;
    }
  }
  return false;
}

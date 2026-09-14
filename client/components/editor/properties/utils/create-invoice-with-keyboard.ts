/**
 * @fileoverview Создание пары send_invoice + keyboard с кнопкой «Оплатить»
 * @module components/editor/properties/utils/create-invoice-with-keyboard
 */

import type { Node } from '@shared/schema';
import { createInvoicePayButton } from './invoice-pay-button';

/** Смещение клавиатуры вправо от счёта (как у hoist message) */
export const INVOICE_KEYBOARD_OFFSET_X = 360;

/**
 * Собирает узел клавиатуры с одной кнопкой оплаты
 * @param id - ID узла keyboard
 * @param position - Позиция на холсте
 * @returns Узел keyboard
 */
export function createInvoicePayKeyboardNode(
  id: string,
  position: { x: number; y: number },
): Node {
  return {
    id,
    type: 'keyboard',
    position,
    data: {
      keyboardType: 'inline',
      buttons: [createInvoicePayButton()],
      oneTimeKeyboard: false,
      resizeKeyboard: true,
      allowMultipleSelection: false,
      markdown: false,
    },
  } as Node;
}

/**
 * Готовит data счёта со ссылкой на клавиатуру (без встроенных кнопок)
 * @param invoiceData - Исходные данные счёта
 * @param keyboardNodeId - ID узла keyboard
 * @returns data для send_invoice
 */
export function linkInvoiceToKeyboard(
  invoiceData: Record<string, unknown>,
  keyboardNodeId: string,
): Record<string, unknown> {
  return {
    ...invoiceData,
    keyboardType: 'none',
    buttons: [],
    keyboardNodeId,
  };
}

/**
 * Создаёт пару: счёт + клавиатура с «Оплатить» справа
 * @param invoiceId - ID счёта
 * @param keyboardId - ID клавиатуры
 * @param position - Позиция счёта
 * @param invoiceData - Данные счёта (без клавиатуры)
 * @returns invoice и keyboard узлы
 */
export function buildInvoiceWithPayKeyboard(
  invoiceId: string,
  keyboardId: string,
  position: { x: number; y: number },
  invoiceData: Record<string, unknown>,
): { invoice: Node; keyboard: Node } {
  const keyboard = createInvoicePayKeyboardNode(keyboardId, {
    x: position.x + INVOICE_KEYBOARD_OFFSET_X,
    y: position.y,
  });
  const invoice: Node = {
    id: invoiceId,
    type: 'send_invoice' as Node['type'],
    position,
    data: linkInvoiceToKeyboard(invoiceData, keyboardId) as Node['data'],
  };
  return { invoice, keyboard };
}

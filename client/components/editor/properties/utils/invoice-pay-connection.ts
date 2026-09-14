/**
 * @fileoverview Связь «Оплатить» → после оплаты (визуально с кнопки, данные у счёта)
 * @module components/editor/properties/utils/invoice-pay-connection
 */

import type { Node } from '@shared/schema';
import { getKeyboardNodeId } from '../../canvas/canvas-node/keyboard-connection';

/**
 * Находит узел send_invoice, привязанный к данной клавиатуре
 * @param keyboardNodeId - ID узла keyboard
 * @param nodes - Узлы листа
 * @returns Host-счёт или undefined
 */
export function findInvoiceHostForKeyboard(
  keyboardNodeId: string,
  nodes: Node[],
): Node | undefined {
  return nodes.find(
    (n) =>
      (n.type as string) === 'send_invoice'
      && getKeyboardNodeId(n.data) === keyboardNodeId,
  );
}

/**
 * Первая кнопка pay на клавиатуре
 * @param keyboardNode - Узел keyboard
 * @returns Кнопка pay или undefined
 */
export function findPayButtonOnKeyboard(keyboardNode: Node): { id: string; text?: string } | undefined {
  const buttons = Array.isArray(keyboardNode.data?.buttons)
    ? (keyboardNode.data.buttons as Array<{ id?: string; action?: string; text?: string }>)
    : [];
  const pay = buttons.find((b) => b.action === 'pay' && typeof b.id === 'string');
  return pay?.id ? { id: pay.id, text: pay.text } : undefined;
}

/**
 * Есть ли у счёта связанная клавиатура с кнопкой «Оплатить»
 * @param invoiceNode - Узел send_invoice
 * @param nodes - Узлы листа
 * @returns true если переход после оплаты рисуем от кнопки pay
 */
export function invoiceUsesPayButtonVisual(invoiceNode: Node, nodes: Node[]): boolean {
  const kbId = getKeyboardNodeId(invoiceNode.data);
  if (!kbId) return false;
  const kb = nodes.find((n) => n.id === kbId && n.type === 'keyboard');
  return Boolean(kb && findPayButtonOnKeyboard(kb));
}

/**
 * Клавиатура счёта: кнопка pay может вести «после оплаты»
 * @param keyboardNode - Узел keyboard
 * @param nodes - Узлы
 * @returns true если это invoice-клавиатура с pay
 */
export function isInvoicePayKeyboard(keyboardNode: Node, nodes: Node[]): boolean {
  if (keyboardNode.type !== 'keyboard') return false;
  if (!findPayButtonOnKeyboard(keyboardNode)) return false;
  return Boolean(findInvoiceHostForKeyboard(keyboardNode.id, nodes));
}

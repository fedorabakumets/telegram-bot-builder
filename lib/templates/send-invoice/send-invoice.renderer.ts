/**
 * @fileoverview Рендерер шаблона send_invoice (+ роутер successful_payment)
 * @module templates/send-invoice/send-invoice.renderer
 */

import type { Node } from '@shared/schema';
import type { SendInvoiceEntry } from './send-invoice.params';
import { renderPartialTemplate } from '../template-renderer';
import { sortButtonsByLayout, computeAdjustStr } from '../keyboard/keyboard.renderer';
import { collectSuccessfulPaymentTriggerEntries } from '../successful-payment-trigger';

/**
 * Собирает SendInvoiceEntry[] из узлов холста
 * @param nodes - Массив узлов
 * @returns Массив записей счетов
 */
export function collectSendInvoiceEntries(nodes: Node[]): SendInvoiceEntry[] {
  const validNodes = nodes.filter(n => n != null);
  return validNodes
    .filter(n => (n.type as string) === 'send_invoice')
    .map(node => {
      const data = node.data as any;
      const customPayload = typeof data?.invoicePayload === 'string' ? data.invoicePayload.trim() : '';
      const targetId = data?.autoTransitionTo || '';
      const targetNode = validNodes.find(n => n.id === targetId);
      const rawButtons = Array.isArray(data?.buttons) ? data.buttons : [];
      const hasKeyboard = rawButtons.length > 0 && data?.keyboardType === 'inline';
      const sortedButtons = hasKeyboard
        ? sortButtonsByLayout(rawButtons, data?.keyboardLayout)
        : [];
      return {
        nodeId: node.id,
        title: data?.invoiceTitle || 'Товар',
        description: data?.invoiceDescription || 'Описание',
        amount: data?.invoiceAmount || '1',
        photoUrl: data?.invoicePhotoUrl || '',
        payload: customPayload || node.id,
        savePaymentAmountTo: data?.savePaymentAmountTo || '',
        savePaymentChargeIdTo: data?.savePaymentChargeIdTo || '',
        autoTransitionTo: targetId,
        targetNodeType: targetNode?.type || 'message',
        hasKeyboard,
        buttons: sortedButtons,
        keyboardLayout: data?.keyboardLayout,
      };
    });
}

/**
 * Генерирует Python: счета, pre_checkout (если есть счета) и общий successful_payment
 * (счёт → триггер). Вызывается при наличии send_invoice и/или successful_payment_trigger.
 * @param nodes - Массив узлов холста
 * @returns Сгенерированный Python-код или пустая строка
 */
export function generateSendInvoiceHandlers(nodes: Node[]): string {
  const entries = collectSendInvoiceEntries(nodes);
  const triggerEntries = collectSuccessfulPaymentTriggerEntries(nodes);
  if (entries.length === 0 && triggerEntries.length === 0) return '';

  return renderPartialTemplate('send-invoice/send-invoice.py.jinja2', {
    sendInvoiceEntries: entries.map((entry) => ({
      ...entry,
      adjustStr: computeAdjustStr(entry.keyboardLayout as any),
    })),
    successfulPaymentTriggerEntries: triggerEntries,
  });
}

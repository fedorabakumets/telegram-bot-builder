/**
 * @fileoverview Рендерер шаблона send_invoice
 * @module templates/send-invoice/send-invoice.renderer
 */

import type { Node } from '@shared/schema';
import type { SendInvoiceEntry } from './send-invoice.params';
import { renderPartialTemplate } from '../template-renderer';

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
      };
    });
}

/**
 * Генерирует Python-код обработчиков всех узлов send_invoice
 * @param nodes - Массив узлов холста
 * @returns Сгенерированный Python-код или пустая строка
 */
export function generateSendInvoiceHandlers(nodes: Node[]): string {
  const entries = collectSendInvoiceEntries(nodes);
  if (entries.length === 0) return '';

  return renderPartialTemplate('send-invoice/send-invoice.py.jinja2', {
    sendInvoiceEntries: entries,
  });
}

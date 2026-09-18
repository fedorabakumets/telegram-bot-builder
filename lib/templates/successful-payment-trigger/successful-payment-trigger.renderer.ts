/**
 * @fileoverview Сбор записей триггера успешной оплаты
 * @module templates/successful-payment-trigger/successful-payment-trigger.renderer
 *
 * Сам хендлер F.successful_payment живёт в send-invoice.py.jinja2
 * (один роутер: счёт → триггер). Здесь только collect + сортировка.
 */

import type { Node } from '@shared/schema';
import type {
  SuccessfulPaymentPayloadFilter,
  SuccessfulPaymentTriggerEntry,
} from './successful-payment-trigger.params';

/** Порядок проверки фильтров: exact → starts_with → all */
const FILTER_ORDER: Record<SuccessfulPaymentPayloadFilter, number> = {
  exact: 0,
  starts_with: 1,
  all: 2,
};

/**
 * Нормализует режим фильтра метки
 * @param raw - Сырое значение из data
 * @returns Допустимый режим фильтра
 */
function normalizeFilter(raw: unknown): SuccessfulPaymentPayloadFilter {
  if (raw === 'exact' || raw === 'starts_with' || raw === 'all') return raw;
  return 'all';
}

/**
 * Собирает SuccessfulPaymentTriggerEntry[] из узлов (exact → starts_with → all)
 * @param nodes - Массив узлов холста
 * @returns Отсортированный массив записей триггеров
 */
export function collectSuccessfulPaymentTriggerEntries(
  nodes: Node[],
): SuccessfulPaymentTriggerEntry[] {
  const validNodes = nodes.filter(n => n != null);
  const nodeMap = new Map(validNodes.map(n => [n.id, n]));
  const entries: SuccessfulPaymentTriggerEntry[] = [];

  for (const node of validNodes) {
    if ((node.type as string) !== 'successful_payment_trigger') continue;
    const data = (node.data ?? {}) as Record<string, unknown>;
    const targetNodeId = String(data.autoTransitionTo ?? '');
    const targetNode = targetNodeId ? nodeMap.get(targetNodeId) : undefined;

    entries.push({
      nodeId: node.id,
      targetNodeId,
      targetNodeType: targetNode?.type || 'message',
      payloadFilter: normalizeFilter(data.payloadFilter),
      payloadValue: String(data.payloadValue ?? ''),
      savePaymentAmountTo: String(data.savePaymentAmountTo ?? ''),
      savePaymentChargeIdTo: String(data.savePaymentChargeIdTo ?? ''),
    });
  }

  return entries.sort(
    (a, b) => FILTER_ORDER[a.payloadFilter] - FILTER_ORDER[b.payloadFilter],
  );
}

/**
 * Генерация кода только для триггеров без счетов — делегирует send-invoice.
 * При наличии send_invoice роутер уже генерируется там вместе с fallback.
 * @param nodes - Массив узлов
 * @returns Пустая строка (роутер в generateSendInvoiceHandlers)
 */
export function generateSuccessfulPaymentTriggerHandlers(nodes: Node[]): string {
  // Роутер всегда генерирует generateSendInvoiceHandlers (счёт и/или триггер)
  void nodes;
  return '';
}

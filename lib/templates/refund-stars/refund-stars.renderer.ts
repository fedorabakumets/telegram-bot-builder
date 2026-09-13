/**
 * @fileoverview Рендерер шаблона refund_stars
 * @module templates/refund-stars/refund-stars.renderer
 */

import type { Node } from '@shared/schema';
import type { RefundStarsEntry, RefundStarsTemplateParams } from './refund-stars.params';
import { refundStarsParamsSchema } from './refund-stars.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Собирает RefundStarsEntry[] из узлов холста
 * @param nodes - Массив узлов
 * @returns Массив записей возврата
 */
export function collectRefundStarsEntries(nodes: Node[]): RefundStarsEntry[] {
  const validNodes = nodes.filter(n => n != null);
  const nodeMap = new Map(validNodes.map(n => [n.id, n]));
  const entries: RefundStarsEntry[] = [];

  for (const node of validNodes) {
    if ((node.type as string) !== 'refund_stars') continue;

    const data = node.data as any;
    const targetNodeId: string = data?.autoTransitionTo ?? '';
    const targetNode = nodeMap.get(targetNodeId);

    entries.push({
      nodeId: node.id,
      safeName: node.id.replace(/[^a-zA-Z0-9_]/g, '_'),
      targetNodeId,
      targetNodeType: targetNode?.type ?? '',
      refundUserSource: data?.refundUserSource === 'custom' ? 'custom' : 'current_user',
      refundUserId: data?.refundUserId ?? '',
      refundChargeId: data?.refundChargeId ?? '',
      ignoreErrors: Boolean(data?.ignoreErrors),
    });
  }

  return entries;
}

/**
 * Генерация Python-обработчиков из параметров шаблона
 * @param params - Параметры шаблона
 * @returns Сгенерированный Python-код
 */
export function generateRefundStars(params: RefundStarsTemplateParams): string {
  if (params.entries.length === 0) return '';
  const validated = refundStarsParamsSchema.parse(params);
  return renderPartialTemplate('refund-stars/refund-stars.py.jinja2', {
    entries: validated.entries,
  });
}

/**
 * Генерация Python-обработчиков из массива узлов
 * @param nodes - Массив узлов холста
 * @returns Сгенерированный Python-код
 */
export function generateRefundStarsHandlers(nodes: Node[]): string {
  const entries = collectRefundStarsEntries(nodes);
  if (entries.length === 0) return '';
  return generateRefundStars({ entries });
}

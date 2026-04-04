/**
 * @fileoverview Функция рендеринга шаблона обработчиков триггеров исходящих сообщений
 * @module templates/outgoing-message-trigger/outgoing-message-trigger.renderer
 */

import type { Node } from '@shared/schema';
import type { OutgoingMessageTriggerEntry, OutgoingMessageTriggerTemplateParams } from './outgoing-message-trigger.params';
import { outgoingMessageTriggerParamsSchema } from './outgoing-message-trigger.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Собирает OutgoingMessageTriggerEntry[] из массива узлов графа.
 * Находит все узлы с type === 'outgoing_message_trigger' и autoTransitionTo.
 *
 * @param nodes - Массив узлов холста
 * @returns Массив OutgoingMessageTriggerEntry для генерации обработчиков
 */
export function collectOutgoingMessageTriggerEntries(nodes: Node[]): OutgoingMessageTriggerEntry[] {
  const validNodes = nodes.filter(n => n != null);
  const nodeMap = new Map(validNodes.map(n => [n.id, n]));
  const entries: OutgoingMessageTriggerEntry[] = [];

  for (const node of validNodes) {
    if (node.type !== 'outgoing_message_trigger') continue;

    const targetNodeId: string = node.data.autoTransitionTo ?? '';
    if (!targetNodeId) continue;

    const targetNode = nodeMap.get(targetNodeId);
    const targetNodeType = targetNode?.type ?? 'message';

    entries.push({ nodeId: node.id, targetNodeId, targetNodeType });
  }

  return entries;
}

/**
 * Генерация Python обработчиков триггеров исходящих сообщений из параметров (низкоуровневый API).
 *
 * @param params - Параметры шаблона
 * @returns Сгенерированный Python код
 */
export function generateOutgoingMessageTriggers(params: OutgoingMessageTriggerTemplateParams): string {
  if (params.entries.length === 0) return '';
  const validated = outgoingMessageTriggerParamsSchema.parse(params);
  return renderPartialTemplate('outgoing-message-trigger/outgoing-message-trigger.py.jinja2', {
    outgoingMessageTriggerEntries: validated.entries,
  });
}

/**
 * Генерация Python обработчиков триггеров исходящих сообщений из массива узлов графа (высокоуровневый API).
 *
 * @param nodes - Массив узлов холста
 * @returns Сгенерированный Python код
 */
export function generateOutgoingMessageTriggerHandlers(nodes: Node[]): string {
  const entries = collectOutgoingMessageTriggerEntries(nodes);
  if (entries.length === 0) return '';
  return generateOutgoingMessageTriggers({ entries });
}

/**
 * @fileoverview Функция рендеринга шаблона middleware триггера входящего сообщения
 * @module templates/incoming-message-trigger/incoming-message-trigger.renderer
 */

import type { Node } from '@shared/schema';
import type { IncomingMessageTriggerEntry, IncomingMessageTriggerTemplateParams } from './incoming-message-trigger.params';
import { incomingMessageTriggerParamsSchema } from './incoming-message-trigger.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Собирает IncomingMessageTriggerEntry[] из массива узлов графа.
 * Находит все узлы с type === 'incoming_message_trigger' и autoTransitionTo.
 *
 * @param nodes - Массив узлов холста
 * @returns Массив IncomingMessageTriggerEntry для генерации middleware
 */
export function collectIncomingMessageTriggerEntries(nodes: Node[]): IncomingMessageTriggerEntry[] {
  const validNodes = nodes.filter(n => n != null);
  const nodeMap = new Map(validNodes.map(n => [n.id, n]));

  const entries: IncomingMessageTriggerEntry[] = [];

  for (const node of validNodes) {
    if (node.type !== 'incoming_message_trigger') continue;

    const targetNodeId: string = node.data.autoTransitionTo ?? '';
    if (!targetNodeId) continue;

    const targetNode = nodeMap.get(targetNodeId);
    const targetNodeType = targetNode?.type ?? 'message';

    entries.push({
      nodeId: node.id,
      targetNodeId,
      targetNodeType,
    });
  }

  return entries;
}

/**
 * Генерация Python middleware триггеров входящих сообщений из параметров (низкоуровневый API).
 *
 * @param params - Параметры шаблона
 * @returns Сгенерированный Python код
 */
export function generateIncomingMessageTriggers(params: IncomingMessageTriggerTemplateParams): string {
  if (params.entries.length === 0) return '';
  const validated = incomingMessageTriggerParamsSchema.parse(params);
  return renderPartialTemplate('incoming-message-trigger/incoming-message-trigger.py.jinja2', {
    incomingMessageTriggerEntries: validated.entries,
  });
}

/**
 * Генерация Python middleware триггеров входящих сообщений из массива узлов графа (высокоуровневый API).
 *
 * @param nodes - Массив узлов холста
 * @returns Сгенерированный Python код
 */
export function generateIncomingMessageTriggerHandlers(nodes: Node[]): string {
  const entries = collectIncomingMessageTriggerEntries(nodes);
  if (entries.length === 0) return '';
  return generateIncomingMessageTriggers({ entries });
}

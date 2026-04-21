/**
 * @fileoverview Функция рендеринга шаблона middleware триггера входящего callback_query
 * @module templates/incoming-callback-trigger/incoming-callback-trigger.renderer
 */

import type { Node } from '@shared/schema';
import type {
  IncomingCallbackTriggerEntry,
  IncomingCallbackTriggerTemplateParams,
} from './incoming-callback-trigger.params';
import { incomingCallbackTriggerParamsSchema } from './incoming-callback-trigger.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Собирает IncomingCallbackTriggerEntry[] из массива узлов графа.
 * Находит все узлы с type === 'incoming_callback_trigger' и autoTransitionTo.
 * @param nodes - Массив узлов холста
 * @returns Массив IncomingCallbackTriggerEntry для генерации middleware
 */
export function collectIncomingCallbackTriggerEntries(nodes: Node[]): IncomingCallbackTriggerEntry[] {
  const validNodes = nodes.filter(n => n != null);
  const nodeMap = new Map(validNodes.map(n => [n.id, n]));
  const entries: IncomingCallbackTriggerEntry[] = [];

  for (const node of validNodes) {
    if (node.type !== 'incoming_callback_trigger') continue;

    const nodeData = node.data as Record<string, unknown>;
    const targetNodeId = typeof nodeData.autoTransitionTo === 'string'
      ? nodeData.autoTransitionTo
      : '';

    if (!targetNodeId) continue;

    const targetNode = nodeMap.get(targetNodeId);
    const targetNodeType = targetNode?.type ?? 'message';
    const callbackPattern = typeof nodeData.callbackPattern === 'string'
      ? nodeData.callbackPattern
      : (typeof nodeData.callbackData === 'string' ? nodeData.callbackData : '');
    const callbackMatchType = typeof nodeData.callbackMatchType === 'string'
      ? nodeData.callbackMatchType
      : (typeof nodeData.matchType === 'string' ? nodeData.matchType : '');

    entries.push({
      nodeId: node.id,
      targetNodeId,
      targetNodeType,
      callbackPattern,
      callbackMatchType,
    });
  }

  return entries;
}

/**
 * Генерация Python middleware триггеров входящих callback_query из параметров.
 * @param params - Параметры шаблона
 * @returns Сгенерированный Python код
 */
export function generateIncomingCallbackTriggers(
  params: IncomingCallbackTriggerTemplateParams,
): string {
  if (params.entries.length === 0) return '';
  const validated = incomingCallbackTriggerParamsSchema.parse(params);
  return renderPartialTemplate('incoming-callback-trigger/incoming-callback-trigger.py.jinja2', {
    incomingCallbackTriggerEntries: validated.entries,
  });
}

/**
 * Генерирует Python middleware триггеров входящих callback_query из массива узлов графа.
 * @param nodes - Массив узлов холста
 * @returns Сгенерированный Python код
 */
export function generateIncomingCallbackTriggerHandlers(nodes: Node[]): string {
  const entries = collectIncomingCallbackTriggerEntries(nodes);
  if (entries.length === 0) return '';
  return generateIncomingCallbackTriggers({ entries });
}

/**
 * @fileoverview Рендерер шаблона узла delete_message
 * @module templates/delete-message/delete-message.renderer
 */

import type { Node } from '@shared/schema';
import type { DeleteMessageEntry, DeleteMessageTemplateParams } from './delete-message.params';
import { deleteMessageParamsSchema } from './delete-message.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Собирает DeleteMessageEntry[] из массива узлов графа.
 * Находит все узлы с type === 'delete_message'.
 *
 * @param nodes - Массив узлов холста
 * @returns Массив DeleteMessageEntry для генерации обработчиков
 */
export function collectDeleteMessageEntries(nodes: Node[]): DeleteMessageEntry[] {
  const validNodes = nodes.filter(n => n != null);
  const nodeMap = new Map(validNodes.map(n => [n.id, n]));
  const entries: DeleteMessageEntry[] = [];

  for (const node of validNodes) {
    if (node.type !== 'delete_message') continue;

    const data = node.data as any;
    const targetNodeId: string = data?.autoTransitionTo ?? '';
    const targetNode = nodeMap.get(targetNodeId);
    const targetNodeType = targetNode?.type ?? '';

    entries.push({
      nodeId: node.id,
      safeName: node.id.replace(/[^a-zA-Z0-9_]/g, '_'),
      targetNodeId,
      targetNodeType,
      messageIdSource: data?.messageIdSource ?? 'current_message',
      messageIdManual: data?.messageIdManual ?? '',
      lastNCount: data?.lastNCount ?? '',
      chatIdSource: data?.chatIdSource ?? 'current_chat',
      chatIdManual: data?.chatIdManual ?? '',
      ignoreErrors: data?.ignoreErrors ?? true,
      bulkDelete: data?.bulkDelete ?? false,
      bulkMessageIdsVariable: data?.bulkMessageIdsVariable ?? '',
    });
  }

  return entries;
}

/**
 * Генерация Python обработчиков узла delete_message из параметров.
 *
 * @param params - Параметры шаблона
 * @returns Сгенерированный Python код
 */
export function generateDeleteMessage(params: DeleteMessageTemplateParams): string {
  if (params.entries.length === 0) return '';
  const validated = deleteMessageParamsSchema.parse(params);
  return renderPartialTemplate('delete-message/delete-message.py.jinja2', {
    entries: validated.entries,
  });
}

/**
 * Генерация Python обработчиков узла delete_message из массива узлов.
 *
 * @param nodes - Массив узлов холста
 * @returns Сгенерированный Python код
 */
export function generateDeleteMessageHandlers(nodes: Node[]): string {
  const entries = collectDeleteMessageEntries(nodes);
  if (entries.length === 0) return '';
  return generateDeleteMessage({ entries });
}

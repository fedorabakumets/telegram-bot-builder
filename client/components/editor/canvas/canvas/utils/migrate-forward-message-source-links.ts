/**
 * @fileoverview Миграция legacy-связей источника для узла `forward_message`.
 *
 * Ранние версии фронтенда сохраняли связь `message/media -> forward_message`
 * как обычный `autoTransitionTo`, одновременно записывая `sourceMessageNodeId`
 * в целевой узел пересылки. Для новой модели такая линия должна означать
 * только источник сообщения, а не автоматический запуск узла пересылки.
 *
 * @module canvas/utils/migrate-forward-message-source-links
 */

import { Node } from '@shared/schema';

/**
 * Типы узлов, которые могут быть источником сообщения для `forward_message`.
 */
const FORWARD_MESSAGE_SOURCE_NODE_TYPES = new Set<Node['type']>([
  'message',
  'media',
  'photo',
  'video',
  'audio',
  'document',
  'sticker',
  'voice',
  'animation',
  'location',
  'contact',
]);

/**
 * Проверяет, может ли узел быть источником сообщения для пересылки.
 *
 * @param node - Узел-источник.
 * @returns `true`, если тип узла допускает привязку как источника пересылки.
 */
function canBeForwardMessageSource(node: Node | undefined): boolean {
  return Boolean(node && FORWARD_MESSAGE_SOURCE_NODE_TYPES.has(node.type));
}

/**
 * Превращает legacy-автопереход `source -> forward_message` в source-link.
 *
 * Миграция делает две вещи:
 * - переносит ID исходного узла в `forward_message.data.sourceMessageNodeId`
 * - очищает у исходного узла `autoTransitionTo` и выключает `enableAutoTransition`
 *
 * @param nodes - Узлы листа.
 * @returns Новый массив узлов с нормализованными связями пересылки.
 */
export function migrateForwardMessageSourceLinks(nodes: Node[]): Node[] {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const sourceNodesToClear = new Set<string>();
  const forwardUpdates = new Map<string, Node['data']>();

  for (const sourceNode of nodes) {
    if (!canBeForwardMessageSource(sourceNode)) {
      continue;
    }

    const autoTransitionTargetId = typeof sourceNode.data?.autoTransitionTo === 'string'
      ? sourceNode.data.autoTransitionTo.trim()
      : '';

    if (!autoTransitionTargetId) {
      continue;
    }

    const targetNode = nodeMap.get(autoTransitionTargetId);
    if (!targetNode || targetNode.type !== 'forward_message') {
      continue;
    }

    const targetData = { ...targetNode.data } as Node['data'] & {
      sourceMessageIdSource?: string;
      sourceMessageId?: string;
      sourceMessageVariableName?: string;
      sourceMessageNodeId?: string;
    };
    const existingSourceNodeId = typeof targetData.sourceMessageNodeId === 'string'
      ? targetData.sourceMessageNodeId.trim()
      : '';

    if (existingSourceNodeId && existingSourceNodeId !== sourceNode.id) {
      continue;
    }

    targetData.sourceMessageNodeId = sourceNode.id;
    targetData.sourceMessageId = '';
    targetData.sourceMessageVariableName = '';

    if (targetData.sourceMessageIdSource === 'manual' || targetData.sourceMessageIdSource === 'variable') {
      targetData.sourceMessageIdSource = 'current_message';
    } else if (!targetData.sourceMessageIdSource) {
      targetData.sourceMessageIdSource = 'current_message';
    }

    forwardUpdates.set(targetNode.id, targetData);
    sourceNodesToClear.add(sourceNode.id);
  }

  if (forwardUpdates.size === 0 && sourceNodesToClear.size === 0) {
    return nodes;
  }

  return nodes.map((node) => {
    if (forwardUpdates.has(node.id)) {
      return {
        ...node,
        data: forwardUpdates.get(node.id)!,
      };
    }

    if (sourceNodesToClear.has(node.id)) {
      return {
        ...node,
        data: {
          ...node.data,
          enableAutoTransition: false,
          autoTransitionTo: '',
        },
      };
    }

    return node;
  });
}

/**
 * @fileoverview Разовая зачистка устаревшего запрета медиа при загрузке сценария
 * @module canvas/utils/strip-legacy-media-permission
 */

import type { Node } from '@shared/schema';
import { stripLegacyMediaPermission } from '@lib/templates/chat-permissions/resolve-mute-media';

/**
 * Переносит устаревший общий запрет медиа в отдельные права и удаляет ключ.
 * @param nodes - Узлы сценария
 * @returns Узлы без устаревшего поля
 */
export function stripLegacyMediaFromNodes(nodes: Node[]): Node[] {
  return nodes.map((node) => {
    if (!node?.data) return node;
    const data = node.data as Record<string, unknown>;
    if (!Object.prototype.hasOwnProperty.call(data, 'canSendMediaMessages')) return node;
    return {
      ...node,
      data: stripLegacyMediaPermission(node.data),
    };
  });
}

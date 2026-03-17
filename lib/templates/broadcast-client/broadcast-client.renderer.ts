/**
 * @fileoverview Рендерер шаблона рассылки Client API (Telethon)
 * @module templates/broadcast-client/broadcast-client.renderer
 */

import type { Node } from '@shared/schema';
import type { BroadcastNode, BroadcastClientTemplateParams } from './broadcast-client.params';
import { broadcastClientParamsSchema } from './broadcast-client.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Собирает BroadcastNode[] из графа узлов.
 * Включает message-узлы с enableBroadcast=true и разворачивает цепочки autoTransitionTo.
 */
export function collectBroadcastNodes(nodes: Node[], broadcastNodeId: string): BroadcastNode[] {
  const broadcastMessages = nodes.filter(n => {
    const d = n.data as any;
    return (
      n.type === 'message' &&
      d?.enableBroadcast === true &&
      (!d?.broadcastTargetNode || d.broadcastTargetNode === 'all' || d.broadcastTargetNode === broadcastNodeId)
    );
  });

  const chain = new Map<string, BroadcastNode>();

  for (const node of broadcastMessages) {
    const d = node.data as any;
    chain.set(node.id, {
      id: node.id,
      text: d.messageText || d.text || '',
      formatMode: d.formatMode || 'none',
      imageUrl: d.imageUrl || '',
      audioUrl: d.audioUrl || '',
      videoUrl: d.videoUrl || '',
      documentUrl: d.documentUrl || '',
      attachedMedia: d.attachedMedia || [],
      autoTransitionTo: d.autoTransitionTo || '',
    });
  }

  // Разворачиваем цепочки autoTransitionTo
  let hasNew = true;
  while (hasNew) {
    hasNew = false;
    for (const entry of chain.values()) {
      if (entry.autoTransitionTo && !chain.has(entry.autoTransitionTo)) {
        const target = nodes.find(n => n.id === entry.autoTransitionTo && n.type === 'message');
        if (target) {
          const d = target.data as any;
          chain.set(target.id, {
            id: target.id,
            text: d.messageText || d.text || '',
            formatMode: d.formatMode || 'none',
            imageUrl: d.imageUrl || '',
            audioUrl: d.audioUrl || '',
            videoUrl: d.videoUrl || '',
            documentUrl: d.documentUrl || '',
            attachedMedia: d.attachedMedia || [],
            autoTransitionTo: d.autoTransitionTo || '',
          });
          hasNew = true;
        }
      }
    }
  }

  return Array.from(chain.values());
}

/**
 * Генерирует Python обработчик рассылки Client API из параметров.
 */
export function generateBroadcastClient(params: BroadcastClientTemplateParams): string {
  const validated = broadcastClientParamsSchema.parse(params);

  const templateContext = {
    ...validated,
    broadcastNodes: validated.broadcastNodes.map(node => ({
      ...node,
      attachedMediaPy: node.attachedMedia.length > 0
        ? `[${node.attachedMedia.map(m => `"${m}"`).join(', ')}]`
        : '[]',
    })),
  };

  return renderPartialTemplate('broadcast-client/broadcast-client.py.jinja2', templateContext);
}

/**
 * Генерирует Python обработчик рассылки Client API из узла графа.
 */
export function generateBroadcastClientFromNode(node: Node, allNodes: Node[]): string {
  const d = node.data as any;
  return generateBroadcastClient({
    nodeId: node.id,
    idSourceType: d.idSourceType || 'bot_users',
    successMessage: d.successMessage || '',
    errorMessage: d.errorMessage || '',
    broadcastNodes: collectBroadcastNodes(allNodes, node.id),
  });
}

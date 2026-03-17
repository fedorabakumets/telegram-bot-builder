/**
 * @fileoverview Рендерер шаблона рассылки
 * @module templates/broadcast/broadcast.renderer
 */

import type { Node } from '@shared/schema';
import type { BroadcastNode, BroadcastTemplateParams } from './broadcast.params';
import { broadcastParamsSchema } from './broadcast.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Собирает список BroadcastNode[] из графа узлов.
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

  // Разворачиваем цепочки autoTransitionTo
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

  // Добавляем узлы из цепочек автопереходов, которых ещё нет в списке
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
 * Генерирует Python обработчик рассылки из параметров (низкоуровневый API).
 */
export function generateBroadcast(params: BroadcastTemplateParams): string {
  const validated = broadcastParamsSchema.parse({
    ...params,
    broadcastApiType: params.broadcastApiType ?? 'bot',
    idSourceType: params.idSourceType ?? 'bot_users',
  });

  // Предсериализуем attachedMedia в Python-литерал, чтобы не использовать tojson в шаблоне
  const templateContext = {
    ...validated,
    broadcastNodes: validated.broadcastNodes.map(node => ({
      ...node,
      attachedMediaPy: node.attachedMedia.length > 0
        ? `[${node.attachedMedia.map(m => `"${m}"`).join(', ')}]`
        : '[]',
    })),
  };

  return renderPartialTemplate('broadcast/broadcast.py.jinja2', templateContext);
}

/**
 * Генерирует Python обработчик рассылки из узла графа (высокоуровневый API).
 * Заменяет generateBroadcastHandler и generateBroadcastClientHandler из bot-generator.
 */
export function generateBroadcastFromNode(node: Node, allNodes: Node[]): string {
  const d = node.data as any;
  const broadcastNodes = collectBroadcastNodes(allNodes, node.id);

  return generateBroadcast({
    nodeId: node.id,
    broadcastApiType: d.broadcastApiType || 'bot',
    idSourceType: d.idSourceType || 'bot_users',
    successMessage: d.successMessage || '',
    errorMessage: d.errorMessage || '',
    broadcastNodes,
  });
}

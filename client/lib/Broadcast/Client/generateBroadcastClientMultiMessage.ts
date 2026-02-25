/**
 * @fileoverview Генерация списка сообщений для рассылки через Client API
 *
 * Этот модуль генерирует Python-код для формирования списка message узлов
 * с учётом цепочки автопереходов. Используется в рассылке через
 * Telegram Client API (Telethon).
 *
 * @module generateBroadcastClientMultiMessage
 */

import { Node } from '@shared/schema';
import { formatTextForPython } from '../../format';

/**
 * Генерирует код для рассылки нескольких message узлов с учётом автопереходов
 *
 * @param {Node[]} nodes - Все узлы проекта
 * @param {string} broadcastNodeId - ID текущего broadcast узла
 * @param {string} indent - Отступ для кода
 * @returns {string} Сгенерированный Python-код
 */
export function generateBroadcastClientMultiMessage(
  nodes: Node[],
  broadcastNodeId: string,
  indent: string = '    '
): string {
  const codeLines: string[] = [];

  // Находим все message узлы с enableBroadcast=true
  const broadcastNodes = nodes.filter(n => {
    const nodeData = n.data as any;
    return n.type === 'message' &&
      nodeData?.enableBroadcast === true &&
      (!nodeData?.broadcastTargetNode || nodeData.broadcastTargetNode === 'all' || nodeData.broadcastTargetNode === broadcastNodeId);
  });

  if (broadcastNodes.length === 0) {
    codeLines.push(`${indent}# Нет сообщений для рассылки с enableBroadcast=true`);
    codeLines.push(`${indent}broadcast_nodes = []`);
    return codeLines.join('\n');
  }

  // Строим полную цепочку узлов с учётом автопереходов
  const allNodesInChain = new Map<string, any>();

  // Сначала добавляем все broadcast узлы
  broadcastNodes.forEach(node => {
    const nodeData = node.data as any;
    allNodesInChain.set(node.id, {
      id: node.id,
      text: nodeData.messageText || nodeData.text || '',
      formatMode: nodeData.formatMode || 'text',
      imageUrl: nodeData.imageUrl || '',
      audioUrl: nodeData.audioUrl || '',
      videoUrl: nodeData.videoUrl || '',
      documentUrl: nodeData.documentUrl || '',
      attachedMedia: nodeData.attachedMedia || [],
      autoTransitionTo: nodeData.autoTransitionTo || ''
    });
  });

  // Теперь проходим по цепочке автопереходов и добавляем недостающие узлы
  let hasNewNodes = true;
  while (hasNewNodes) {
    hasNewNodes = false;
    allNodesInChain.forEach((nodeData) => {
      if (nodeData.autoTransitionTo && !allNodesInChain.has(nodeData.autoTransitionTo)) {
        // Ищем узел для автоперехода в общем списке узлов
        const targetNode = nodes.find(n => n.id === nodeData.autoTransitionTo);
        if (targetNode && targetNode.type === 'message') {
          const targetData = targetNode.data as any;
          allNodesInChain.set(targetNode.id, {
            id: targetNode.id,
            text: targetData.messageText || targetData.text || '',
            formatMode: targetData.formatMode || 'text',
            imageUrl: targetData.imageUrl || '',
            audioUrl: targetData.audioUrl || '',
            videoUrl: targetData.videoUrl || '',
            documentUrl: targetData.documentUrl || '',
            attachedMedia: targetData.attachedMedia || [],
            autoTransitionTo: targetData.autoTransitionTo || ''
          });
          hasNewNodes = true;
        }
      }
    });
  }

  codeLines.push(`${indent}# Рассылка нескольких сообщений с учётом цепочки автопереходов`);
  codeLines.push(`${indent}broadcast_nodes = [`);

  allNodesInChain.forEach((nodeData) => {
    const formattedText = formatTextForPython(nodeData.text);

    codeLines.push(`${indent}    {`);
    codeLines.push(`${indent}        "id": "${nodeData.id}",`);
    codeLines.push(`${indent}        "text": ${formattedText},`);
    codeLines.push(`${indent}        "formatMode": "${nodeData.formatMode}",`);
    codeLines.push(`${indent}        "imageUrl": "${nodeData.imageUrl}",`);
    codeLines.push(`${indent}        "audioUrl": "${nodeData.audioUrl}",`);
    codeLines.push(`${indent}        "videoUrl": "${nodeData.videoUrl}",`);
    codeLines.push(`${indent}        "documentUrl": "${nodeData.documentUrl}",`);
    codeLines.push(`${indent}        "attachedMedia": ${JSON.stringify(nodeData.attachedMedia)},`);
    codeLines.push(`${indent}        "autoTransitionTo": "${nodeData.autoTransitionTo}"`);
    codeLines.push(`${indent}    },`);
  });

  codeLines.push(`${indent}]`);

  return codeLines.join('\n');
}

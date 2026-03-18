import { BotData, BotDataWithSheets, Node } from '@shared/schema';

// ============================================================================
// УТИЛИТЫ ДЛЯ РАБОТЫ С ДАННЫМИ БОТА
// ============================================================================

function hasSheetsStructure(data: BotData | BotDataWithSheets): data is BotDataWithSheets {
  return 'sheets' in data && Array.isArray((data as BotDataWithSheets).sheets);
}

/**
 * Преобразует данные узлов, добавляя медиа-URL в attachedMedia.
 */
function transformNodeData(nodes: Node[]): Node[] {
  if (!Array.isArray(nodes)) {
    return [];
  }
  return nodes
    .filter(node => node !== null && node !== undefined)
    .map(node => {
    const hasImage = node.data?.imageUrl;
    const hasVideo = node.data?.videoUrl;
    const hasAudio = node.data?.audioUrl;
    const hasDocument = node.data?.documentUrl;

    if ((hasImage || hasVideo || hasAudio || hasDocument) && (!node.data.attachedMedia || !Array.isArray(node.data.attachedMedia))) {
      const mediaVariables = [];

      if (hasImage) mediaVariables.push(`image_url_${node.id}`);
      if (hasVideo) mediaVariables.push(`video_url_${node.id}`);
      if (hasAudio) mediaVariables.push(`audio_url_${node.id}`);
      if (hasDocument) mediaVariables.push(`document_url_${node.id}`);

      return {
        ...node,
        data: {
          ...node.data,
          attachedMedia: mediaVariables,
          ...(hasImage && { [`image_url_${node.id}`]: node.data.imageUrl }),
          ...(hasVideo && { [`video_url_${node.id}`]: node.data.videoUrl }),
          ...(hasAudio && { [`audio_url_${node.id}`]: node.data.audioUrl }),
          ...(hasDocument && { [`document_url_${node.id}`]: node.data.documentUrl })
        }
      };
    }

    return node;
  });
}

/**
 * Извлекает и объединяет все узлы и связи из данных бота.
 */
export function extractNodesAndConnections(botData: BotData | BotDataWithSheets) {
  if (!botData) return { nodes: [] };

  if (hasSheetsStructure(botData)) {
    let allNodes: Node[] = [];

    botData.sheets.forEach((sheet) => {
      if (sheet.nodes && Array.isArray(sheet.nodes)) {
        const transformedNodes = transformNodeData(sheet.nodes);
        allNodes = allNodes.concat(transformedNodes);
      }
    });

    return { nodes: allNodes };
  } else {
    const transformedNodes = transformNodeData(botData.nodes || []);
    return { nodes: transformedNodes };
  }
}

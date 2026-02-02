import { BotData } from '@shared/schema';

// ============================================================================
// УТИЛИТЫ ДЛЯ РАБОТЫ С ДАННЫМИ БОТА
// ============================================================================
// Функция для преобразования медиа-URL в attachedMedia
function transformNodeData(nodes: any[]): any[] {
  return nodes.map(node => {
    // Проверяем наличие любых медиа-URL и добавляем их в attachedMedia
    const hasImage = node.data?.imageUrl;
    const hasVideo = node.data?.videoUrl;
    const hasAudio = node.data?.audioUrl;
    const hasDocument = node.data?.documentUrl;

    // Если у узла есть какие-либо медиа-URL и нет attachedMedia, добавляем их в attachedMedia
    if ((hasImage || hasVideo || hasAudio || hasDocument) && (!node.data.attachedMedia || !Array.isArray(node.data.attachedMedia))) {
      // Создаем переменные для хранения URL медиа
      const mediaVariables = [];

      if (hasImage) {
        const imageUrlVariable = `image_url_${node.id}`;
        mediaVariables.push(imageUrlVariable);
      }

      if (hasVideo) {
        const videoUrlVariable = `video_url_${node.id}`;
        mediaVariables.push(videoUrlVariable);
      }

      if (hasAudio) {
        const audioUrlVariable = `audio_url_${node.id}`;
        mediaVariables.push(audioUrlVariable);
      }

      if (hasDocument) {
        const documentUrlVariable = `document_url_${node.id}`;
        mediaVariables.push(documentUrlVariable);
      }

      // Обновляем данные узла
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          attachedMedia: mediaVariables,
          // Также сохраняем сами URL в переменных, чтобы система могла их использовать
          ...(hasImage && { [`image_url_${node.id}`]: node.data.imageUrl }),
          ...(hasVideo && { [`video_url_${node.id}`]: node.data.videoUrl }),
          ...(hasAudio && { [`audio_url_${node.id}`]: node.data.audioUrl }),
          ...(hasDocument && { [`document_url_${node.id}`]: node.data.documentUrl })
        }
      };

      return updatedNode;
    }

    return node;
  });
}

// Функция для сбора всех узлов и связей из всех листов проекта
export function extractNodesAndConnections(botData: BotData) {
  if (!botData) return { nodes: [], connections: [] };

  if ((botData as any).sheets && Array.isArray((botData as any).sheets)) {
    // Многолистовой проект - собираем узлы и связи из всех листов
    let allNodes: any[] = [];
    let allConnections: any[] = [];

    (botData as any).sheets.forEach((sheet: any) => {
      if (sheet.nodes && Array.isArray(sheet.nodes)) {
        // Преобразуем узлы, добавляя imageUrl в attachedMedia
        const transformedNodes = transformNodeData(sheet.nodes);
        allNodes = allNodes.concat(transformedNodes);
      }
      if (sheet.connections && Array.isArray(sheet.connections)) {
        allConnections = allConnections.concat(sheet.connections);
      }
    });

    return { nodes: allNodes, connections: allConnections };
  } else {
    // Обычный проект
    const transformedNodes = transformNodeData(botData.nodes || []);
    return {
      nodes: transformedNodes,
      connections: botData.connections || []
    };
  }
}

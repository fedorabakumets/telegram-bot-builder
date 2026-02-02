import { BotData } from '@shared/schema';

// ============================================================================
// УТИЛИТЫ ДЛЯ РАБОТЫ С ДАННЫМИ БОТА
// ============================================================================
// Функция для преобразования imageUrl в attachedMedia
function transformNodeData(nodes: any[]): any[] {
  return nodes.map(node => {
    // Если у узла есть imageUrl, но нет attachedMedia, добавляем imageUrl в attachedMedia
    if (node.data?.imageUrl && (!node.data.attachedMedia || !Array.isArray(node.data.attachedMedia))) {
      // Создаем переменную для хранения URL изображения
      const imageUrlVariable = `image_url_${node.id}`;

      // Обновляем данные узла
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          attachedMedia: [imageUrlVariable],
          // Также сохраняем сам URL в переменной, чтобы система могла его использовать
          [imageUrlVariable]: node.data.imageUrl
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

import { BotData } from '@shared/schema';

// ============================================================================
// УТИЛИТЫ ДЛЯ РАБОТЫ С ДАННЫМИ БОТА
// ============================================================================

/**
 * Преобразует данные узлов, добавляя медиа-URL в attachedMedia.
 * Функция сканирует каждый узел на наличие медиа-URL (изображения, видео, аудио, документы)
 * и создает соответствующие переменные для хранения этих URL в формате attachedMedia.
 * 
 * Процесс преобразования:
 * 1. Проверяет наличие медиа-URL в данных узла
 * 2. Создает переменные с именами в формате "тип_url_id_узла"
 * 3. Добавляет эти переменные в массив attachedMedia
 * 4. Сохраняет оригинальные URL в отдельных переменных для системы
 * 
 * @param nodes - Массив узлов для преобразования
 * @returns Массив преобразованных узлов с обновленными данными
 * 
 * @example
 * // Узел с изображением и видео
 * const nodes = [{
 *   id: 'node1',
 *   data: { imageUrl: 'url1', videoUrl: 'url2' }
 * }];
 * const transformed = transformNodeData(nodes);
 * // Результат: узел с attachedMedia: ['image_url_node1', 'video_url_node1']
 * // и переменными: image_url_node1: 'url1', video_url_node1: 'url2'
 */
function transformNodeData(nodes: any[]): any[] {
  if (!Array.isArray(nodes)) {
    return []; // Возвращаем пустой массив, если nodes не является массивом
  }
  return nodes
    .filter(node => node !== null && node !== undefined) // Фильтруем null/undefined значения
    .map(node => {
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

/**
 * Извлекает и объединяет все узлы и связи из данных бота.
 * Функция поддерживает как обычные проекты, так и многолистовые проекты,
 * автоматически определяя структуру данных и применяя необходимые преобразования.
 * 
 * Логика работы:
 * 1. Проверяет наличие данных бота
 * 2. Определяет тип проекта (многолистовой или обычный)
 * 3. Для многолистовых проектов собирает данные со всех листов
 * 4. Применяет transformNodeData ко всем узлам
 * 5. Возвращает объединенные результаты
 * 
 * @param botData - Данные бота (могут содержать nodes/connections или sheets с узлами и связями)
 * @returns Объект с массивами nodes и connections
 * 
 * @example
 * // Обычный проект
 * const botData = {
 *   nodes: [{ id: 'node1', data: { text: 'Hello' } }],
 *   connections: [{ from: 'node1', to: 'node2' }]
 * };
 * const result = extractNodesAndConnections(botData);
 * // Возвращает: { nodes: [...], connections: [...] }
 * 
 * @example
 * // Многолистовой проект
 * const botData = {
 *   sheets: [
 *     { nodes: [...], connections: [...] },
 *     { nodes: [...], connections: [...] }
 *   ]
 * };
 * const result = extractNodesAndConnections(botData);
 * // Возвращает: { nodes: [...объединенные узлы...], connections: [...объединенные связи...] }
 */
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

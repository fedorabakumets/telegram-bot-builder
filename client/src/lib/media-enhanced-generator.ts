import { Node } from '@shared/schema';
import { generateEnhancedMessageHandler } from './enhanced-media-handler';

/**
 * Проверяет, имеет ли узел медиа-контент
 * @param node - Узел для проверки
 * @returns true, если узел имеет медиа-контент
 */
function hasMediaContent(node: Node): boolean {
  return !!(node.data.imageUrl || node.data.videoUrl || node.data.audioUrl || node.data.documentUrl);
}

/**
 * Проверяет, является ли узел подходящим для медиа-обработки
 * @param node - Узел для проверки
 * @returns true, если узел должен обрабатываться медиа-обработчиком
 */
function isSuitableForMediaHandler(node: Node): boolean {
  // Подходит для медиа-обработки, если:
  // 1. Это узел типа message или command
  // 2. Имеет медиа-контент
  return (node.type === 'message' || node.type === 'command') && hasMediaContent(node);
}

/**
 * Генерирует обработчики для узлов с медиа-контентом
 * @param nodes - Массив узлов для генерации обработчиков
 * @returns Сгенерированный код обработчиков
 */
export function generateMediaEnhancedHandlers(nodes: Node[]): string {
  let code = '';

  // Фильтруем узлы, которые подходят для медиа-обработки
  const mediaNodes = nodes.filter(node => isSuitableForMediaHandler(node));

  if (mediaNodes.length > 0) {
    code += '\n# Обработчики узлов с медиа-контентом\n';

    mediaNodes.forEach(node => {
      code += generateEnhancedMessageHandler(node);
      code += '\n';
    });
  }

  return code;
}

/**
 * Проверяет, является ли узел узлом с медиа-контентом
 * @param node - Узел для проверки
 * @returns true, если узел является узлом с медиа-контентом
 */
export function isMediaNode(node: Node): boolean {
  return isSuitableForMediaHandler(node);
}
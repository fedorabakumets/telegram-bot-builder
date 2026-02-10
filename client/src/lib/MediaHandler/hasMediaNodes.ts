import { BotNode } from "../bot-generator";

// Функция для проверки наличия медиа-файлов
export function hasMediaNodes(nodes: BotNode[]): boolean {
  if (!nodes || nodes.length === 0) return false;
  return nodes.some(node =>
    node && // Проверяем, что node не null/undefined
    (node.type === 'animation' ||
    node.type === 'photo' ||
    node.type === 'video' ||
    node.type === 'audio' ||
    node.type === 'document' ||
    // Также проверяем, есть ли у узлов медиа-атрибуты
    node.data?.imageUrl ||
    node.data?.videoUrl ||
    node.data?.audioUrl ||
    node.data?.documentUrl ||
    node.data?.enablePhotoInput ||
    node.data?.enableVideoInput ||
    node.data?.enableAudioInput ||
    node.data?.enableDocumentInput)
  );
}

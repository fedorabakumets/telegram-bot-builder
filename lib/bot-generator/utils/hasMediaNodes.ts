import { BotNode, NODE_TYPES } from "../types";

// Функция для проверки наличия медиа-файлов
export function hasMediaNodes(nodes: BotNode[]): boolean {
  if (!nodes || nodes.length === 0) return false;
  return nodes.some(node =>
    node && // Проверяем, что node не null/undefined
    (node.type === NODE_TYPES.ANIMATION ||
    node.type === NODE_TYPES.PHOTO ||
    node.type === NODE_TYPES.VIDEO ||
    node.type === NODE_TYPES.AUDIO ||
    node.type === NODE_TYPES.DOCUMENT ||
    // Также проверяем, есть ли у узлов медиа-атрибуты
    node.data?.imageUrl ||
    node.data?.videoUrl ||
    node.data?.audioUrl ||
    node.data?.documentUrl ||
    node.data?.enablePhotoInput ||
    node.data?.enableVideoInput ||
    node.data?.enableAudioInput ||
    node.data?.enableDocumentInput ||
    // Проверяем attachedMedia (массив URL или переменных)
    (node.data?.attachedMedia && Array.isArray(node.data.attachedMedia) && node.data.attachedMedia.length > 0)
    )
  );
}

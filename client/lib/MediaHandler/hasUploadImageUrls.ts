import { BotNode } from "../bot-generator";

// Функция для проверки наличия узлов с imageUrl, начинающимся на '/uploads/'
export function hasUploadImageUrls(nodes: BotNode[]): boolean {
  if (!nodes || nodes.length === 0) return false;
  
  return nodes.some(node =>
    node && 
    ((node.data?.imageUrl && typeof node.data.imageUrl === 'string' && node.data.imageUrl.startsWith('/uploads/')) ||
     (node.data?.videoUrl && typeof node.data.videoUrl === 'string' && node.data.videoUrl.startsWith('/uploads/')) ||
     (node.data?.audioUrl && typeof node.data.audioUrl === 'string' && node.data.audioUrl.startsWith('/uploads/')) ||
     (node.data?.documentUrl && typeof node.data.documentUrl === 'string' && node.data.documentUrl.startsWith('/uploads/')))
  );
}
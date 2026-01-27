import { Node } from '../../../../shared/schema';

// ============================================================================
// УТИЛИТЫ ДЛЯ РАБОТЫ С ПЕРЕМЕННЫМИ И МЕДИА
// ============================================================================
// Функция для сбора всех медиапеременных из узлов
export function collectMediaVariables(nodes: Node[]): Map<string, { type: string; variable: string; }> {
  const mediaVars = new Map<string, { type: string; variable: string; }>();

  if (!nodes || nodes.length === 0) return mediaVars;

  nodes.forEach(node => {
    // Собираем переменные из узлов с фото
    if (node.data.enablePhotoInput && node.data.photoInputVariable) {
      mediaVars.set(node.data.photoInputVariable, {
        type: 'photo',
        variable: node.data.photoInputVariable
      });
    }

    // Собираем переменные из узлов с видео
    if (node.data.enableVideoInput && node.data.videoInputVariable) {
      mediaVars.set(node.data.videoInputVariable, {
        type: 'video',
        variable: node.data.videoInputVariable
      });
    }

    // Собираем переменные из узлов с аудио
    if (node.data.enableAudioInput && node.data.audioInputVariable) {
      mediaVars.set(node.data.audioInputVariable, {
        type: 'audio',
        variable: node.data.audioInputVariable
      });
    }

    // Собираем переменные из узлов с документами
    if (node.data.enableDocumentInput && node.data.documentInputVariable) {
      mediaVars.set(node.data.documentInputVariable, {
        type: 'document',
        variable: node.data.documentInputVariable
      });
    }
  });

  return mediaVars;
}

import { Node } from '@shared/schema';
// ============================================================================
// УТИЛИТЫ ДЛЯ РАБОТЫ С ПЕРЕМЕННЫМИ И МЕДИА
// ============================================================================
// Функция для сбора всех медиапеременных из узлов
export function collectMediaVariables(nodes: Node[]): Map<string, { type: string; variable: string; }> {
  const mediaVars = new Map<string, { type: string; variable: string; }>();

  if (!nodes || nodes.length === 0) return mediaVars;

  nodes
    .filter(node => node !== null && node !== undefined) // Фильтруем null/undefined узлы
    .forEach(node => {
    // Собираем переменные из узлов с фото
    if (node.data?.enablePhotoInput && node.data?.photoInputVariable) {
      mediaVars.set(node.data.photoInputVariable, {
        type: 'photo',
        variable: node.data.photoInputVariable
      });
    }

    // Собираем переменные из узлов с видео
    if (node.data?.enableVideoInput && node.data?.videoInputVariable) {
      mediaVars.set(node.data.videoInputVariable, {
        type: 'video',
        variable: node.data.videoInputVariable
      });
    }

    // Собираем переменные из узлов с аудио
    if (node.data?.enableAudioInput && node.data?.audioInputVariable) {
      mediaVars.set(node.data.audioInputVariable, {
        type: 'audio',
        variable: node.data.audioInputVariable
      });
    }

    // Собираем переменные из узлов с документами
    if (node.data?.enableDocumentInput && node.data?.documentInputVariable) {
      mediaVars.set(node.data.documentInputVariable, {
        type: 'document',
        variable: node.data.documentInputVariable
      });
    }

    // Собираем переменные из attachedMedia (включая imageUrl)
    if (node.data?.attachedMedia && Array.isArray(node.data.attachedMedia)) {
      node.data.attachedMedia.forEach((mediaVar: string) => {
        // Проверяем, является ли переменная imageUrl (обычно имеет формат image_url_{nodeId})
        if (mediaVar.startsWith('image_url_')) {
          mediaVars.set(mediaVar, {
            type: 'photo',
            variable: mediaVar
          });
        } else if (mediaVar.startsWith('video_url_')) {
          mediaVars.set(mediaVar, {
            type: 'video',
            variable: mediaVar
          });
        } else if (mediaVar.startsWith('audio_url_')) {
          mediaVars.set(mediaVar, {
            type: 'audio',
            variable: mediaVar
          });
        } else if (mediaVar.startsWith('document_url_')) {
          mediaVars.set(mediaVar, {
            type: 'document',
            variable: mediaVar
          });
        }
        // ИСПРАВЛЕНИЕ: Также поддерживаем переменные типа audioUrlVar_*, videoUrlVar_* и т.д.
        else if (mediaVar.includes('audio') && mediaVar.includes('Url')) {
          mediaVars.set(mediaVar, {
            type: 'audio',
            variable: mediaVar
          });
        } else if (mediaVar.includes('video') && mediaVar.includes('Url')) {
          mediaVars.set(mediaVar, {
            type: 'video',
            variable: mediaVar
          });
        } else if (mediaVar.includes('image') && mediaVar.includes('Url')) {
          mediaVars.set(mediaVar, {
            type: 'photo',
            variable: mediaVar
          });
        } else if (mediaVar.includes('document') && mediaVar.includes('Url')) {
          mediaVars.set(mediaVar, {
            type: 'document',
            variable: mediaVar
          });
        }
      });
    }

    // Собираем переменные из imageUrl и documentUrl напрямую из данных узла
    if (node.data?.imageUrl) {
      const mediaVar = `image_url_${node.id}`;
      mediaVars.set(mediaVar, {
        type: 'photo',
        variable: mediaVar
      });
    }

    if (node.data?.documentUrl) {
      const mediaVar = `document_url_${node.id}`;
      mediaVars.set(mediaVar, {
        type: 'document',
        variable: mediaVar
      });
    }

    if (node.data?.videoUrl) {
      const mediaVar = `video_url_${node.id}`;
      mediaVars.set(mediaVar, {
        type: 'video',
        variable: mediaVar
      });
    }

    if (node.data?.audioUrl) {
      const mediaVar = `audio_url_${node.id}`;
      mediaVars.set(mediaVar, {
        type: 'audio',
        variable: mediaVar
      });
    }
  });

  return mediaVars;
}

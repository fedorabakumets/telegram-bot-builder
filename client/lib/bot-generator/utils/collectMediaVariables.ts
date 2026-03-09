import { Node } from '@shared/schema';

/**
 * @fileoverview Сбор медиапеременных из узлов проекта
 * 
 * Модуль предоставляет функцию для сбора всех медиапеременных (photo, video, audio, document)
 * из узлов проекта. Поддерживает различные форматы именования переменных:
 * - image_url_*, video_url_*, audio_url_*, document_url_*
 * - imageUrlVar_*, videoUrlVar_*, audioUrlVar_*, documentUrlVar_*
 * 
 * @module collectMediaVariables
 */

// ============================================================================
// УТИЛИТЫ ДЛЯ РАБОТЫ С ПЕРЕМЕННЫМИ И МЕДИА
// ============================================================================

/**
 * Собирает все медиапеременные из узлов проекта в карту MediaVariablesMap
 * 
 * @param nodes - Массив узлов проекта для анализа
 * @returns Карта медиапеременных, где ключ - имя переменной, значение - объект с типом медиа и именем переменной
 * 
 * @example
 * const nodes = [
 *   { id: 'start', data: { attachedMedia: ['imageUrlVar_start'], imageUrl: 'https://...' } },
 *   { id: 'menu', data: { enablePhotoInput: true, photoInputVariable: 'user_photo' } }
 * ];
 * const mediaVars = collectMediaVariables(nodes);
 * // Map { 'imageUrlVar_start' => { type: 'photo', variable: 'imageUrlVar_start' } }
 */
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
        /** Тип медиа: "photo", "video", "audio", "document", "sticker" */
        let mediaType: string = '';

        // Проверяем, является ли переменная imageUrl (обычно имеет формат image_url_{nodeId})
        if (mediaVar.startsWith('image_url_') || mediaVar.startsWith('imageUrlVar')) {
          mediaType = 'photo';
        } else if (mediaVar.startsWith('video_url_') || mediaVar.startsWith('videoUrlVar')) {
          mediaType = 'video';
        } else if (mediaVar.startsWith('audio_url_') || mediaVar.startsWith('audioUrlVar')) {
          mediaType = 'audio';
        } else if (mediaVar.startsWith('document_url_') || mediaVar.startsWith('documentUrlVar')) {
          mediaType = 'document';
        }

        // Если тип медиа определен, добавляем переменную в карту
        if (mediaType) {
          mediaVars.set(mediaVar, {
            type: mediaType,
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

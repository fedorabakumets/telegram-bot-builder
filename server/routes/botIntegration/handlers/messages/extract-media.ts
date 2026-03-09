/**
 * @fileoverview Утилита извлечения медиа из узла
 *
 * Получает медиафайлы из данных узла через storage.
 * Поддерживает форматы: массив ID, массив объектов {mediaId, mediaType}, imageUrl.
 */

import type { IStorage } from "../../../../storages/storage";

/**
 * Медиафайл для отправки
 */
export interface SendMediaFile {
  /** ID медиафайла */
  id: number;
  /** URL медиафайла */
  url: string;
  /** Тип медиа: "photo", "video", "audio", "document" */
  type: string;
}

/**
 * Извлекает медиафайлы из данных узла
 *
 * @param nodeData - Данные узла
 * @param storage - Хранилище данных
 * @returns Массив медиафайлов
 */
export async function extractMediaFromNode(
  nodeData: Record<string, unknown>,
  storage: IStorage
): Promise<SendMediaFile[]> {
  const mediaFiles: SendMediaFile[] = [];

  // Проверяем imageUrl (статичное изображение)
  const imageUrl = nodeData.imageUrl as string;
  if (imageUrl && imageUrl !== 'undefined' && imageUrl.startsWith('/uploads/')) {
    mediaFiles.push({
      id: 0, // Для статических изображений ID = 0
      url: imageUrl,
      type: 'photo',
    });
  }

  // Проверяем attachedMedia
  const attachedMedia = nodeData.attachedMedia as unknown;

  if (Array.isArray(attachedMedia)) {
    for (const media of attachedMedia) {
      // Формат 1: строка (например, "imageUrlVar_start")
      if (typeof media === 'string') {
        // Пропускаем "undefined" значения
        if (media === 'undefined' || media.startsWith('undefined')) {
          continue;
        }

        // Если это URL (начинается с /uploads/)
        if (media.startsWith('/uploads/')) {
          mediaFiles.push({
            id: 0,
            url: media,
            type: 'photo',
          });
        }
        // Если это переменная (например, imageUrlVar_start), пробуем найти в nodeData
        else {
          const mediaUrl = nodeData[media] as string;
          if (mediaUrl && mediaUrl.startsWith('/uploads/')) {
            mediaFiles.push({
              id: 0,
              url: mediaUrl,
              type: 'photo',
            });
          }
        }
      }
      // Формат 2: объект { mediaId: number; mediaType: string }
      else if (typeof media === 'object' && media !== null && 'mediaId' in media) {
        const mediaObj = media as { mediaId: number; mediaType: string };
        const mediaRecord = await storage.getMediaFile(mediaObj.mediaId);
        if (mediaRecord) {
          mediaFiles.push({
            id: mediaRecord.id,
            url: mediaRecord.url,
            type: mediaObj.mediaType || 'photo',
          });
        }
      }
    }
  }

  return mediaFiles;
}

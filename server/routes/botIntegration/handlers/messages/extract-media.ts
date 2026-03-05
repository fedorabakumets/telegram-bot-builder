/**
 * @fileoverview Утилита извлечения медиа из узла
 * 
 * Получает медиафайлы из данных узла через storage.
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
  const attachedMedia = nodeData.attachedMedia as Array<{ mediaId: number; mediaType: string }> || [];
  const mediaFiles: SendMediaFile[] = [];

  for (const media of attachedMedia) {
    const mediaRecord = await storage.getMediaFile(media.mediaId);
    if (mediaRecord) {
      mediaFiles.push({
        id: mediaRecord.id,
        url: mediaRecord.url,
        type: media.mediaType,
      });
    }
  }

  return mediaFiles;
}

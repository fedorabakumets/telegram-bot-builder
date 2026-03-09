/**
 * @fileoverview Интерфейс параметров для скачивания медиа из Telegram
 * @module server/telegram/types/media-download-params.ts
 */

/**
 * Параметры для скачивания медиафайла из Telegram
 */
export interface MediaDownloadParams {
  /** Токен Telegram бота */
  botToken: string;

  /** file_id медиафайла из Telegram */
  fileId: string;

  /** ID проекта для организации файлов */
  projectId: number;

  /** Оригинальное имя файла (опционально, для документов) */
  originalFileName?: string;
}

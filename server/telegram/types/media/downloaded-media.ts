/**
 * @fileoverview Интерфейс информации о скачанном медиафайле
 * @module server/telegram/types/downloaded-media
 */

/**
 * Информация о скачанном медиафайле из Telegram
 */
export interface DownloadedMedia {
  /** Относительный путь к файлу от корня проекта */
  filePath: string;

  /** Размер файла в байтах */
  fileSize: number;

  /** MIME-тип файла (например, "image/jpeg") */
  mimeType: string;

  /** Имя файла с расширением */
  fileName: string;
}

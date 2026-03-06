/**
 * @fileoverview Тип для информации о файле из Telegram API
 * @module server/telegram/types/telegram-file-info.ts
 */

/**
 * Информация о файле из ответа Telegram Bot API
 */
export interface TelegramFileInfo {
  /** file_path для скачивания файла */
  file_path: string;

  /** Размер файла в байтах */
  file_size?: number;
}

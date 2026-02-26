/**
 * @fileoverview Тип сообщения бота с медиа-данными
 * @description Расширяет стандартный тип BotMessage дополнительными полями для работы с медиа-контентом
 * @module
 */

import { BotMessage } from '@shared/schema';

/**
 * Расширенное сообщение бота с медиа-вложениями
 * @typedef {Object} BotMessageWithMedia
 * @description Комбинирует базовый тип BotMessage с дополнительным массивом медиа-файлов
 * @see BotMessage - базовый тип сообщения из схемы базы данных
 */
export type BotMessageWithMedia = BotMessage & {
  /**
   * Массив медиа-вложений сообщения
   * @type {Array<{ id: number; url: string; type: string; width?: number; height?: number }>}
   * @property {number} id - Уникальный идентификатор медиа-файла в базе данных
   * @property {string} url - URL или путь к файлу (например, "/uploads/image.jpg")
   * @property {string} type - Тип медиа: "photo", "video", "audio", "document", "sticker"
   * @property {number} [width] - Опционально: ширина изображения в пикселях
   * @property {number} [height] - Опционально: высота изображения в пикселях
   */
  media?: Array<{
    id: number;
    url: string;
    type: string;
    width?: number;
    height?: number;
  }>;
};

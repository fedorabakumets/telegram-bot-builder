import { BotMessage } from '@shared/schema';

/**
 * Расширенное сообщение бота с медиа-вложениями
 */
export type BotMessageWithMedia = BotMessage & {
  /** Массив медиа-вложений сообщения */
  media?: Array<{
    /** Уникальный идентификатор медиа-файла в базе данных */
    id: number;
    /** URL или путь к файлу */
    url: string;
    /** Тип медиа: "photo", "video", "audio", "document", "sticker" */
    type?: string;
    /** Тип файла: "photo", "video", "audio", "document" */
    fileType?: string;
    /** Ширина изображения в пикселях */
    width?: number;
    /** Высота изображения в пикселях */
    height?: number;
  }>;
};

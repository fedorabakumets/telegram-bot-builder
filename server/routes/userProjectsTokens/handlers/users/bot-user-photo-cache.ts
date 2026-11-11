/** @fileoverview Общий кэш локальных аватаров пользователей бота в процессе API. */
import { access } from 'node:fs/promises';
import { createBotUserPhotoCache } from './bot-user-photo-cache-engine';
import { getBotUserPhotoLocation, loadBotUserPhoto } from './bot-user-photo-download';

/** Получает адрес аватара с ограничением параллелизма и повторных обращений к Telegram. */
export const getBotUserPhotoUrl = createBotUserPhotoCache({
  load: loadBotUserPhoto,
  /** Проверяет, не удалён ли файл сборщиком или администратором. */
  exists: async (input) => {
    try {
      await access(getBotUserPhotoLocation(input).path);
      return true;
    } catch {
      return false;
    }
  },
});

/** @fileoverview Кэш метаданных аватаров без скачивания и хранения файлов на диске. */
import { createBotUserPhotoCache, type BotUserPhotoInput } from './bot-user-photo-cache-engine';
import { loadBotUserPhotoFileId } from './bot-user-photo-file-id';

/** Ограничивает повторные обращения за идентификаторами аватаров к Telegram. */
const getFileId = createBotUserPhotoCache({ load: loadBotUserPhotoFileId });

/**
 * Возвращает метаданные и закрытый адрес для интерфейса текущего проекта.
 * @param input - Проверенный контекст бота и пользователя.
 * @returns Идентификатор для исходного бота и адрес для авторизованного интерфейса.
 */
export async function getBotUserPhoto(input: BotUserPhotoInput) {
  const photoFileId = await getFileId(input);
  const query = photoFileId ? new URLSearchParams({ fileId: photoFileId, tokenId: String(input.tokenId) }) : null;
  return {
    photoFileId,
    photoUrl: query ? `/api/projects/${input.projectId}/telegram-file?${query}` : null,
  };
}

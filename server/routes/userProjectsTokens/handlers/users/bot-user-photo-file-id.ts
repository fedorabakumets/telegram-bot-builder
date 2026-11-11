/** @fileoverview Получение идентификатора аватара из Telegram без скачивания и хранения файла. */
import { getTelegramApiBaseUrl } from '../../../../utils/telegram-api-url';
import { fetchWithProxy } from '../../../../utils/telegram-proxy';
import { validateBotUserPhotoInput, type BotUserPhotoInput } from './bot-user-photo-input';
import { readPhotoResponse } from './bot-user-photo-response';

export type { BotUserPhotoInput } from './bot-user-photo-input';

/** Ответ Telegram с необходимыми полями результата. */
interface TelegramPhotoResult {
  /** Успешность операции. */
  ok?: boolean;
  /** Данные операции. */
  result?: {
    /** Число фотографий. */
    total_count?: number;
    /** Варианты фотографий. */
    photos?: Array<Array<{ /** Идентификатор файла. */ file_id: string }>>;
  };
}

/**
 * Получает идентификатор крупнейшего варианта аватара в пределах общего срока.
 * @param input - Проверяемые параметры пользователя и бота
 * @returns Идентификатор для этого бота либо null при подтверждённом отсутствии фотографии
 */
export async function loadBotUserPhotoFileId(input: BotUserPhotoInput): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  timeout.unref();
  try {
    validateBotUserPhotoInput(input);
    const query = new URLSearchParams({ user_id: input.userId, limit: '1' });
    const url = `${getTelegramApiBaseUrl()}/bot${input.token}/getUserProfilePhotos?${query}`;
    const response = await fetchWithProxy(url, { signal: controller.signal, redirect: 'error' });
    const bytes = await readPhotoResponse(response, 256 * 1024, controller.signal);
    const data = JSON.parse(bytes.toString('utf8')) as TelegramPhotoResult;
    if (data?.ok !== true || !data.result) throw new Error('Сервис фотографий временно недоступен');
    if (data.result.total_count === 0) return null;
    if (!Number.isSafeInteger(data.result.total_count) || data.result.total_count! < 1) {
      throw new Error('Некорректный ответ сервиса фотографий');
    }
    const variants = data.result.photos?.[0];
    const fileId = variants?.[variants.length - 1]?.file_id;
    if (typeof fileId !== 'string' || !/^[A-Za-z0-9_-]{1,2048}$/.test(fileId)) {
      throw new Error('Некорректный идентификатор фотографии');
    }
    return fileId;
  } catch {
    throw new Error('Не удалось получить идентификатор фотографии пользователя');
  } finally {
    clearTimeout(timeout);
  }
}

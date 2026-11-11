/** @fileoverview Загрузка фотографии Telegram с общим сроком, лимитом размера и атомарным сохранением. */
import { randomUUID } from 'node:crypto';
import { mkdir, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { getTelegramApiBaseUrl } from '../../../../utils/telegram-api-url';
import { fetchWithProxy } from '../../../../utils/telegram-proxy';
import { getBotUserPhotoLocation, type BotUserPhotoInput } from './bot-user-photo-location';
import { encodePhotoFilePath, readPhotoResponse } from './bot-user-photo-response';

export { getBotUserPhotoLocation, type BotUserPhotoInput } from './bot-user-photo-location';

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
    /** Относительный путь файла. */
    file_path?: string;
  };
}

/**
 * Получает ограниченный ответ API в пределах общего срока.
 * @param url - Адрес API
 * @param signal - Сигнал общего срока
 * @returns Проверенный ответ Telegram
 */
async function requestPhotoJson(url: string, signal: AbortSignal): Promise<TelegramPhotoResult> {
  const response = await fetchWithProxy(url, { signal, redirect: 'error' });
  const data = JSON.parse((await readPhotoResponse(response, 256 * 1024, signal)).toString('utf8')) as TelegramPhotoResult;
  if (data?.ok !== true || !data.result) throw new Error('Сервис фотографий временно недоступен');
  return data;
}

/**
 * Загружает аватар без повторного использования устаревших файлов; сроками кэша управляет вызывающий модуль.
 * @param input - Проверяемые параметры пользователя и бота
 * @returns Адрес сохранённого файла либо null при подтверждённом отсутствии фотографии
 */
export async function loadBotUserPhoto(input: BotUserPhotoInput): Promise<string | null> {
  let temporary: string | undefined;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  timeout.unref();
  try {
    const location = getBotUserPhotoLocation(input);
    const origin = getTelegramApiBaseUrl();
    const base = `${origin}/bot${input.token}`;
    const photos = await requestPhotoJson(`${base}/getUserProfilePhotos?${new URLSearchParams({ user_id: input.userId, limit: '1' })}`, controller.signal);
    if (photos.result!.total_count === 0) return null;
    const variants = photos.result!.photos?.[0];
    const fileId = variants?.[variants.length - 1]?.file_id;
    if (typeof fileId !== 'string' || !fileId || fileId.length > 2048) throw new Error('Некорректный идентификатор фотографии');
    const file = await requestPhotoJson(`${base}/getFile?${new URLSearchParams({ file_id: fileId })}`, controller.signal);
    const url = `${origin}/file/bot${input.token}/${encodePhotoFilePath(file.result!.file_path)}`;
    const response = await fetchWithProxy(url, { signal: controller.signal, redirect: 'error' });
    const bytes = await readPhotoResponse(response, 5 * 1024 * 1024, controller.signal);
    if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
      throw new Error('Недопустимый формат фотографии');
    }
    await mkdir(dirname(location.path), { recursive: true });
    temporary = `${location.path}.${randomUUID()}.tmp`;
    await writeFile(temporary, bytes, { flag: 'wx', signal: controller.signal });
    controller.signal.throwIfAborted();
    await rename(temporary, location.path);
    temporary = undefined;
    return location.url;
  } catch {
    throw new Error('Не удалось загрузить фотографию пользователя');
  } finally {
    clearTimeout(timeout);
    if (temporary) await unlink(temporary).catch(() => undefined);
  }
}

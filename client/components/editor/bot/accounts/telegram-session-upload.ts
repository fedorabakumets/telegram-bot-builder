/** @fileoverview Чтение выбранных файлов для подключения Telegram-аккаунта. */

/**
 * Кодирует небольшой файл из поля формы для передачи защищённому API.
 * @param file - Выбранный пользователем файл.
 * @returns Байты файла в base64.
 */
export async function readTelegramSessionUpload(file: FormDataEntryValue | null): Promise<string> {
  if (!(file instanceof File) || file.size === 0 || file.size > 1024 * 1024) {
    throw new Error('Выберите файл сессии размером до 1 МБ');
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  let content = '';
  for (let index = 0; index < bytes.length; index += 8192) {
    content += String.fromCharCode(...bytes.subarray(index, index + 8192));
  }
  return btoa(content);
}

/**
 * Читает JSON и возвращает только поля приложения Telegram.
 * @param file - Выбранный файл с метаданными.
 * @returns Отфильтрованный объект метаданных.
 */
export async function readTelegramSessionMetadata(file: FormDataEntryValue | null) {
  if (!(file instanceof File) || !file.size || file.size > 64 * 1024) {
    throw new Error('Выберите файл JSON размером до 64 КБ');
  }
  const text = await file.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Не удалось прочитать файл JSON');
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Файл настроек должен содержать объект JSON');
  }
  const fields = ['api_id', 'api_hash', 'app_id', 'app_hash', 'apiId', 'apiHash'];
  return Object.fromEntries(fields
    .filter(key => typeof data[key] === 'string' || typeof data[key] === 'number')
    .map(key => [key, data[key]]));
}

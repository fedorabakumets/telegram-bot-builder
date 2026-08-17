/**
 * @fileoverview Чтение файлов из буфера обмена (скриншоты, скопированные файлы).
 * @module components/editor/files/panel/read-clipboard-files
 */

/** MIME-типы, которые не являются файлом для загрузки */
const TEXT_TYPES = new Set(['text/plain', 'text/html', 'text/uri-list']);

/**
 * Расширение файла по MIME-типу буфера.
 * @param mime - MIME-тип blob
 * @returns Расширение с точкой
 */
function extFromMime(mime: string): string {
  if (mime === 'image/jpeg') return '.jpg';
  if (mime === 'image/svg+xml') return '.svg';
  const subtype = mime.split('/')[1]?.split(';')[0];
  return subtype ? `.${subtype}` : '.bin';
}

/**
 * Собирает File из blob буфера.
 * @param blob - Содержимое
 * @param mime - MIME-тип
 * @returns File с именем clipboard-*
 */
function blobToFile(blob: Blob, mime: string): File {
  const type = blob.type || mime;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return new File([blob], `clipboard-${stamp}${extFromMime(type)}`, { type });
}

/**
 * Читает файлы из системного буфера (жест пользователя — клик по кнопке).
 * @returns Массив файлов (может быть пустым)
 */
export async function readClipboardFiles(): Promise<File[]> {
  if (!navigator.clipboard?.read) {
    throw new Error('Браузер не даёт читать буфер. Вставьте файл через Ctrl+V.');
  }
  const items = await navigator.clipboard.read();
  const files: File[] = [];
  for (const item of items) {
    for (const type of item.types) {
      if (TEXT_TYPES.has(type)) continue;
      const blob = await item.getType(type);
      files.push(blobToFile(blob, type));
    }
  }
  return files;
}

/**
 * Ошибка доступа к Clipboard API (не Ctrl+V).
 * @param error - Исключение браузера
 * @returns true, если чтение буфера запрещено
 */
export function isClipboardDenied(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /permission denied|notallowederror|read permission|not allowed/i.test(message);
}

/**
 * Горячая клавиша вставки файла: Ctrl/⌘+V, Ctrl+М (русская раскладка, та же
 * физическая клавиша KeyV) и Shift+Insert.
 * @param event - Клавиатурное событие
 * @returns true, если это вставка
 */
export function isPasteHotkey(event: KeyboardEvent): boolean {
  if (event.repeat) return false;
  if (event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
    return event.key === 'Insert' || event.code === 'Insert';
  }
  if (!(event.ctrlKey || event.metaKey) || event.altKey) return false;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  return event.code === 'KeyV' || key === 'v' || key === 'м';
}

/**
 * Достаёт файлы из события paste.
 * Берёт и FileList, и image/* из DataTransferItemList (скриншоты Windows).
 * @param event - Событие вставки
 * @returns Массив файлов
 */
export function filesFromClipboardEvent(event: ClipboardEvent): File[] {
  const listed = event.clipboardData?.files;
  if (listed && listed.length > 0) return Array.from(listed);
  const items = event.clipboardData?.items;
  if (!items) return [];
  const files: File[] = [];
  for (const item of Array.from(items)) {
    if (item.kind !== 'file' && !item.type.startsWith('image/')) continue;
    const file = item.getAsFile();
    if (file) files.push(file);
  }
  return files;
}

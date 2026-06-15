/**
 * @fileoverview Хелперы для сборки multipart/form-data и определения MIME-типов
 * Переиспользуются при отправке одиночного медиа и альбома в Telegram.
 */

/** MIME-типы по расширению файла */
const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  gif: 'image/gif', webp: 'image/webp',
  mp4: 'video/mp4', avi: 'video/x-msvideo', mov: 'video/quicktime', webm: 'video/webm',
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4',
  pdf: 'application/pdf', zip: 'application/zip',
};

/**
 * Определяет MIME-тип по имени файла
 * @param fileName - Имя файла
 * @returns MIME-тип
 */
export function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return MIME_TYPES[ext] ?? 'application/octet-stream';
}

/**
 * Проверяет является ли URL локальным путём к файлу на сервере
 * @param url - URL или путь
 * @returns true если это локальный путь
 */
export function isLocalPath(url: string): boolean {
  return url.startsWith('/uploads/') || url.startsWith('uploads/');
}

/**
 * Описание одного файла для multipart-тела запроса
 */
export interface MultipartFile {
  /** Имя поля формы */
  field: string;
  /** Имя файла */
  fileName: string;
  /** Содержимое файла */
  buffer: Buffer;
}

/**
 * Строит multipart/form-data тело запроса для отправки файлов в Telegram
 * @param fields - Текстовые поля формы
 * @param files - Список файлов для прикрепления
 * @returns Объект с body и boundary
 */
export function buildMultipartBody(
  fields: Record<string, string | undefined>,
  files: MultipartFile[],
): { body: Buffer; boundary: string } {
  const boundary = `----TelegramBotBoundary${Date.now()}`;
  const CRLF = '\r\n';
  const parts: Buffer[] = [];

  // Текстовые поля
  for (const [name, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    parts.push(Buffer.from(
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="${name}"${CRLF}${CRLF}` +
      `${value}${CRLF}`
    ));
  }

  // Файлы
  for (const file of files) {
    const mimeType = getMimeType(file.fileName);
    parts.push(Buffer.from(
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="${file.field}"; filename="${file.fileName}"${CRLF}` +
      `Content-Type: ${mimeType}${CRLF}${CRLF}`
    ));
    parts.push(file.buffer);
    parts.push(Buffer.from(CRLF));
  }

  parts.push(Buffer.from(`--${boundary}--${CRLF}`));

  return { body: Buffer.concat(parts), boundary };
}

/**
 * @fileoverview Проверка, что байты — картинка png, jpeg, webp или gif
 * @module shared/support/support-image
 */

/** Максимальный размер одной картинки поддержки: 8 МБ */
export const SUPPORT_IMAGE_MAX_BYTES = 8 * 1024 * 1024;

/** Распознанный тип картинки */
export interface SupportImageKind {
  /** MIME для Content-Type и записи вложения */
  mime: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
  /** Расширение для ключа объекта */
  ext: "png" | "jpg" | "webp" | "gif";
}

/**
 * Сравнивает начало буфера с сигнатурой
 * @param bytes - Начало файла
 * @param signature - Ожидаемые байты
 * @returns true, если сигнатура совпала
 */
function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((byte, index) => bytes[index] === byte);
}

/**
 * Определяет тип картинки по содержимому, а не по расширению имени
 * @param bytes - Начало или весь файл
 * @returns Тип или null, если это не разрешённая картинка
 */
export function detectSupportImage(bytes: Uint8Array): SupportImageKind | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47])) return { mime: "image/png", ext: "png" };
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { mime: "image/jpeg", ext: "jpg" };
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61])) return { mime: "image/gif", ext: "gif" };
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])) return { mime: "image/gif", ext: "gif" };
  const webp =
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    bytes.length >= 12 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;
  if (webp) return { mime: "image/webp", ext: "webp" };
  return null;
}

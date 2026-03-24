/**
 * @fileoverview Утилиты для медиа-ноды
 */

/** Иконки для типов медиафайлов */
export const MEDIA_TYPE_ICONS: Record<string, string> = {
  image: 'fas fa-image',
  video: 'fas fa-video',
  audio: 'fas fa-music',
  document: 'fas fa-file-alt',
};

/**
 * Определяет тип медиа по URL
 * @param url - URL медиафайла
 * @returns Тип медиа: "image", "video", "audio", "document"
 */
export function getMediaTypeByUrl(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
  if (['mp4', 'avi', 'mov', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio';
  return 'document';
}

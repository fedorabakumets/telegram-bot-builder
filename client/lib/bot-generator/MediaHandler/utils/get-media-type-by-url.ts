/**
 * @fileoverview Определение типа медиа по URL
 *
 * @module getMediaTypeByUrl
 */

/** Тип медиа: "photo", "video", "audio", "document" */
export type MediaType = 'photo' | 'video' | 'audio' | 'document';

/**
 * Определяет тип медиа по расширению файла в URL
 *
 * @param url - URL или путь к файлу
 * @returns Тип медиа
 *
 * @example
 * getMediaTypeByUrl('file.jpg') // 'photo'
 * getMediaTypeByUrl('video.mp4') // 'video'
 */
export function getMediaTypeByUrl(url: string): MediaType {
  const ext = url.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'photo';
  if (['mp4', 'avi', 'mov', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio';
  return 'document';
}

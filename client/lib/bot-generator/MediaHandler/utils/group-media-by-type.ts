/**
 * @fileoverview Группировка медиафайлов по типам
 *
 * @module groupMediaByType
 */

import type { MediaType } from './get-media-type-by-url';
import { getMediaTypeByUrl } from './get-media-type-by-url';

/** Группа медиафайлов одного типа */
export interface MediaGroup {
  /** Тип медиа в группе */
  type: MediaType;
  /** URL файлов в группе */
  urls: string[];
}

/**
 * Разделяет медиафайлы на группы по типам
 *
 * @param urls - Массив URL медиафайлов
 * @returns Массив групп медиа по типам
 *
 * @example
 * const groups = groupMediaByType(['file1.jpg', 'file2.pdf', 'file3.mp4']);
 * // [{ type: 'photo', urls: ['file1.jpg'] }, { type: 'document', urls: ['file2.pdf'] }]
 */
export function groupMediaByType(urls: string[]): MediaGroup[] {
  const groups = new Map<MediaType, string[]>();

  urls.forEach(url => {
    const type = getMediaTypeByUrl(url);
    if (!groups.has(type)) {
      groups.set(type, []);
    }
    groups.get(type)!.push(url);
  });

  const result: MediaGroup[] = [];
  groups.forEach((urls, type) => {
    result.push({ type, urls });
  });

  return result;
}

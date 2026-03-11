/**
 * @fileoverview Проверка возможности отправки медиа в одной группе
 *
 * @module canSendInOneGroup
 */

import { groupMediaByType } from './group-media-by-type';

/**
 * Проверяет, можно ли отправить медиафайлы в одной группе sendMediaGroup
 *
 * Документы нельзя смешивать с photo/video/audio.
 *
 * @param urls - Массив URL медиафайлов
 * @returns true если все файлы можно отправить вместе
 *
 * @example
 * canSendInOneGroup(['file1.jpg', 'file2.mp4']) // true
 * canSendInOneGroup(['file1.jpg', 'file2.pdf']) // false
 */
export function canSendInOneGroup(urls: string[]): boolean {
  const groups = groupMediaByType(urls);
  if (groups.length === 1) return true;

  const hasDocument = groups.some(g => g.type === 'document');
  return !hasDocument;
}

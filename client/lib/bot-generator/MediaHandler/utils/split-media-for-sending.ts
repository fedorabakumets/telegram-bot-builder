/**
 * @fileoverview Разделение медиа для отправки (документы отдельно)
 *
 * @module splitMediaForSending
 */

import { groupMediaByType } from './group-media-by-type';

/**
 * Разделяет медиафайлы на две категории:
 * - groupable: photo/video/audio (можно в sendMediaGroup)
 * - documents: документы (отдельная отправка)
 *
 * Telegram не позволяет смешивать документы с другими типами
 * медиа в sendMediaGroup.
 *
 * @param urls - Массив URL медиафайлов
 * @returns Объект с разделёнными группами
 *
 * @example
 * const { groupable, documents } = splitMediaForSending([
 *   'file1.jpg',
 *   'file2.pdf',
 *   'file3.mp4'
 * ]);
 * // groupable: ['file1.jpg', 'file3.mp4']
 * // documents: ['file2.pdf']
 */
export function splitMediaForSending(urls: string[]): {
  groupable: string[];
  documents: string[];
} {
  const groups = groupMediaByType(urls);

  const groupable: string[] = [];
  const documents: string[] = [];

  groups.forEach(group => {
    if (group.type === 'document') {
      documents.push(...group.urls);
    } else {
      groupable.push(...group.urls);
    }
  });

  return { groupable, documents };
}

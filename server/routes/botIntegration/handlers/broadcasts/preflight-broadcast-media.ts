/** @fileoverview Проверка общих вложений до начала массовой отправки. */
import { assertOwnedMediaAvailable } from '../messages/owned-media-content';
import { assertRemoteMediaReference } from '../messages/media-reference-security';
import type { SendMediaFile } from '../messages/extract-media';

/** Проверяет каждую уникальную ссылку один раз, не загружая файл целиком в память.
 * @param mediaFiles - Общие вложения рассылки
 * @param projectId - Проект-владелец файлов
 * @returns Завершение проверки всех ссылок или ошибка до первой отправки
 */
export async function preflightBroadcastMedia(mediaFiles: SendMediaFile[], projectId: number): Promise<void> {
  for (const value of new Set(mediaFiles.map(file => file.url))) {
    if (value.startsWith('/uploads/') || value.startsWith('uploads/')) {
      await assertOwnedMediaAvailable(value, projectId);
    } else {
      await assertRemoteMediaReference(value);
    }
  }
}

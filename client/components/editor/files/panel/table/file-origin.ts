/** @fileoverview Подписи автора и хранилища с учётом источника медиафайла. */
import type { ProjectFile } from '../../hooks/use-project-files';
import type { CollaboratorInfo } from '../../hooks/use-project-collaborators';

/**
 * Разделяет отправителя сообщения Telegram и сотрудника, загрузившего файл в панель.
 * @param file - Файл и источник
 * @param collaborators - Участники проекта
 * @returns Подписи строки автора и места хранения
 */
export function getFileOrigin(file: ProjectFile, collaborators: CollaboratorInfo[]) {
  const uploader = collaborators.find(person => person.userId === file.uploadedBy);
  if (file.source === 'incoming') {
    return { authorLabel: 'Отправитель', author: file.userId != null ? `Telegram ID ${file.userId}` : 'Не сохранён в сообщении', storage: 'Telegram' };
  }
  if (file.source === 'outgoing') {
    return { authorLabel: 'Отправил', author: 'Бот', storage: 'Telegram' };
  }
  return { authorLabel: 'Загрузил', author: uploader?.name ?? (file.uploadedBy != null ? `Telegram ID ${file.uploadedBy}` : 'Не указан'), storage: file.storageName ?? file.storageBackend ?? 'Локальное' };
}

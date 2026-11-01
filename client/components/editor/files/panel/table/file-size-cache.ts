/** @fileoverview Синхронизация уточнённого размера сообщения с загруженными списками файлов проекта. */
import type { QueryClient } from '@tanstack/react-query';
import type { ProjectFile } from '../../hooks/use-project-files';

/** Минимальная структура кэшированной страницы файлов. */
interface CachedFilesPage {
  /** Файлы страницы; прочие поля ответа сохраняются без изменений. */
  files: ProjectFile[];
}

/**
 * Немедленно обновляет размер во всех загруженных страницах этого проекта.
 * @param client - Кэш запросов интерфейса
 * @param projectId - Проект сообщения
 * @param file - Уточнённая запись сообщения
 * @param size - Полученный положительный размер
 */
export function updateFileSizeCache(client: QueryClient, projectId: number, file: ProjectFile, size: number): void {
  if (!Number.isSafeInteger(size) || size <= 0) return;
  client.setQueriesData<CachedFilesPage>({ queryKey: ['/api/projects', projectId, 'files'] }, page => {
    if (!page?.files) return page;
    return { ...page, files: page.files.map(item => item.id === file.id && item.source === file.source && item.fileId === file.fileId
      ? { ...item, fileSize: size } : item) };
  });
}

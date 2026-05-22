/**
 * @fileoverview React Query хук для получения файлов проекта
 * @module components/editor/files/hooks/use-project-files
 */

import { useQuery } from '@tanstack/react-query';

/** Тип источника файлов */
export type FileSource = 'incoming' | 'outgoing' | 'uploaded';

/** Тип медиа файла */
export type FileMediaType = 'photo' | 'video' | 'audio' | 'voice' | 'document' | 'sticker';

/** Структура одного файла из API */
export interface ProjectFile {
  /** Уникальный идентификатор */
  id: number;
  /** Источник файла */
  source: FileSource;
  /** Тип медиа */
  mediaType: FileMediaType | null;
  /** Telegram file_id */
  fileId: string | null;
  /** Имя файла */
  fileName: string | null;
  /** Размер файла в байтах */
  fileSize: number | null;
  /** Длительность (для аудио/видео) */
  duration: number | null;
  /** ID пользователя (для incoming) */
  userId?: number | null;
  /** ID токена бота */
  tokenId?: number | null;
  /** Дата создания */
  createdAt: string | null;
}

/** Ответ API со списком файлов */
interface FilesResponse {
  /** Массив файлов */
  files: ProjectFile[];
  /** Общее количество */
  total: number;
  /** Текущая страница */
  page: number;
  /** Лимит на страницу */
  limit: number;
}

/** Параметры хука */
interface UseProjectFilesParams {
  /** ID проекта */
  projectId: number;
  /** Источник файлов */
  source: FileSource;
  /** Фильтр по типу медиа */
  type?: FileMediaType;
  /** ID токена бота */
  tokenId?: number | null;
  /** Номер страницы */
  page?: number;
}

/**
 * Хук для получения файлов проекта с пагинацией и фильтрацией
 * @param params - Параметры запроса
 * @returns Данные файлов, состояние загрузки и ошибка
 */
export function useProjectFiles({ projectId, source, type, tokenId, page = 1 }: UseProjectFilesParams) {
  return useQuery<FilesResponse>({
    queryKey: ['/api/projects', projectId, 'files', source, type, tokenId, page],
    queryFn: async () => {
      const params = new URLSearchParams({ source, page: String(page), limit: '50' });
      if (type) params.set('type', type);
      if (tokenId) params.set('tokenId', String(tokenId));
      const res = await fetch(`/api/projects/${projectId}/files?${params}`);
      if (!res.ok) throw new Error('Ошибка загрузки файлов');
      return res.json();
    },
    enabled: !!projectId,
    staleTime: 15000,
  });
}

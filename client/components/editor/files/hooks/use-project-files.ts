/**
 * @fileoverview React Query хук для получения файлов проекта.
 * Поддерживает категорию-источник (all/incoming/outgoing/uploaded),
 * расширенные фильтры (Req 6.*) и поля хранилища в выдаче (Req 7.*).
 * Сериализация query-параметров вынесена в project-files-query-params.
 * @module components/editor/files/hooks/use-project-files
 */

import { useQuery } from '@tanstack/react-query';

import { buildFilesQueryParams, type FileCategory, type FileFilters } from './project-files-query-params';

export type { FileCategory, FileFilters, FileFilterMediaType, SizeUnit } from './project-files-query-params';

/** Тип источника файлов (легаси-параметр) */
export type FileSource = 'incoming' | 'outgoing' | 'uploaded';

/** Тип медиа файла */
export type FileMediaType = 'photo' | 'video' | 'animation' | 'audio' | 'voice' | 'video_note' | 'document' | 'sticker';

/** Структура одного файла из API */
export interface ProjectFile {
  /** Внутренний идентификатор записи media_files */
  id: number;
  /** Источник файла */
  source: FileSource;
  /** Тип медиа */
  mediaType: FileMediaType | null;
  /** Telegram file_id (кэш по умолчанию) */
  fileId: string | null;
  /** Имя файла */
  fileName: string | null;
  /** Размер файла в байтах */
  fileSize: number | null;
  /** Длительность (для аудио/видео) */
  duration: number | null;
  /** URL/JSON-метаданные доступа к файлу (для загруженных) */
  url?: string | null;
  /** ID пользователя (для incoming) */
  userId?: number | null;
  /** ID токена бота */
  tokenId?: number | null;
  /** file_id обложки (thumbnail) */
  thumbnailFileId?: string | null;
  /** Расширение файла (из имени или по типу) */
  extension?: string | null;
  /** ID загрузившего коллаборатора (telegram_users.id) */
  uploadedBy?: number | null;
  /** Карта tokenId → file_id из media_file_tokens (Req 8.*) */
  fileIdsByToken?: Record<number, string>;
  /** Тип бэкенда хранилища ("local" | "s3") */
  storageBackend?: string;
  /** ID конфигурации хранилища (storage_configs.id) */
  storageConfigId?: string | null;
  /** Человекочитаемое имя хранилища (для бейджа) */
  storageName?: string | null;
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
  /** Категория-источник (имеет приоритет над source) */
  category?: FileCategory;
  /** Легаси источник файлов (используется, если не задан category) */
  source?: FileSource;
  /** Легаси фильтр по типу медиа (мапится в filters.mediaType) */
  type?: FileMediaType;
  /** Расширенные фильтры (имя, дата, тип, сотрудник, размер, хранилище) */
  filters?: FileFilters;
  /** ID токена бота */
  tokenId?: number | null;
  /** Номер страницы */
  page?: number;
}

/**
 * Хук для получения файлов проекта с категорией, фильтрами и пагинацией.
 * @param params - Параметры запроса
 * @returns Данные файлов, состояние загрузки и ошибка
 */
export function useProjectFiles({ projectId, category, source, type, filters, tokenId, page = 1 }: UseProjectFilesParams) {
  const effectiveCategory: FileCategory = category ?? source ?? 'uploaded';
  const effectiveFilters: FileFilters = { ...filters };
  if (type && effectiveFilters.mediaType === undefined) {
    effectiveFilters.mediaType = type;
  }

  const queryString = buildFilesQueryParams({
    category: effectiveCategory,
    filters: effectiveFilters,
    tokenId,
    page,
  }).toString();

  return useQuery<FilesResponse>({
    queryKey: ['/api/projects', projectId, 'files', queryString],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/files?${queryString}`);
      if (!res.ok) throw new Error('Ошибка загрузки файлов');
      return res.json();
    },
    enabled: !!projectId,
    staleTime: 15000,
  });
}

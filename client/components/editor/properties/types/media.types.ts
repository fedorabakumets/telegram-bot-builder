/**
 * @fileoverview Типы для медиа-хуков
 * @module types/media.types
 */

/**
 * Тип медиафайла
 * @description Определяет категорию медиа
 */
export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'sticker';

/**
 * Прогресс загрузки файла
 * @description Процент выполнения от 0 до 100
 */
export type UploadProgress = number;

/**
 * Параметры загрузки медиафайла
 */
export interface MediaUploadParams {
  /** Файл для загрузки */
  file: File;
  /** Описание файла */
  description?: string;
  /** Теги для поиска */
  tags?: string[];
  /** Публичный доступ */
  isPublic?: boolean;
  /** Callback прогресса загрузки */
  onProgress?: (progress: UploadProgress) => void;
}

/**
 * Параметры массовой загрузки
 */
export interface MultipleMediaUploadParams {
  /** Массив файлов для загрузки */
  files: File[];
  /** Описание по умолчанию */
  defaultDescription?: string;
  /** Публичный доступ */
  isPublic?: boolean;
  /** Общий callback прогресса */
  onProgress?: (progress: UploadProgress) => void;
  /** Callback прогресса для каждого файла */
  onFileProgress?: (fileIndex: number, progress: UploadProgress) => void;
}

/**
 * Результат массовой загрузки
 */
export interface MultipleUploadResult {
  /** Количество успешно загруженных файлов */
  success: number;
  /** Количество ошибок */
  errors: number;
  /** Массив загруженных файлов */
  uploadedFiles: MediaFile[];
  /** Детали ошибок */
  errorDetails: unknown[];
  /** Статистика загрузки */
  statistics: Record<string, unknown>;
}

/**
 * Медиафайл (локальный тип для хуков)
 */
export interface MediaFile {
  /** ID файла */
  id: number;
  /** ID проекта */
  projectId: number;
  /** URL файла */
  url: string;
  /** Тип медиа */
  fileType: string;
  /** Имя файла */
  fileName: string;
  /** Размер файла в байтах */
  fileSize: number;
  /** Описание */
  description: string | null;
  /** Теги */
  tags: string[] | null;
  /** Публичный доступ */
  isPublic: number | null;
  /** Количество использований */
  usageCount: number | null;
  /** Дата создания */
  createdAt: Date | null;
  /** Дата обновления */
  updatedAt: Date | null;
  /** Путь к файлу */
  filePath: string;
  /** MIME тип */
  mimeType: string;
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { MediaFile } from "@shared/schema";

/**
 * Интерфейс результата проверки URL
 * @interface UrlCheckResult
 * @property {boolean} accessible - Доступен ли URL для скачивания
 * @property {object} [fileInfo] - Информация о файле
 * @property {string} [fileInfo.mimeType] - MIME-тип файла
 * @property {number} [fileInfo.size] - Размер файла в байтах
 * @property {string} [fileInfo.fileName] - Имя файла
 * @property {string} [fileInfo.fileType] - Тип файла (изображение, видео и т.д.)
 * @property {string} [fileInfo.category] - Категория файла
 * @property {number} [fileInfo.sizeMB] - Размер файла в мегабайтах
 * @property {string} [error] - Сообщение об ошибке, если проверка не удалась
 * @property {string} [code] - Код ошибки
 */
export interface UrlCheckResult {
  accessible: boolean;
  fileInfo?: {
    mimeType?: string;
    size?: number;
    fileName?: string;
    fileType?: string;
    category?: string;
    sizeMB?: number;
  };
  error?: string;
  code?: string;
}

/**
 * Интерфейс результата скачивания файла по URL
 * @interface UrlDownloadResult
 * @extends MediaFile
 * @property {object} downloadInfo - Информация о скачивании
 * @property {string} downloadInfo.sourceUrl - Исходный URL файла
 * @property {string} [downloadInfo.category] - Категория файла
 * @property {number} downloadInfo.sizeMB - Размер файла в мегабайтах
 * @property {number} downloadInfo.autoTagsAdded - Количество автоматически добавленных тегов
 * @property {string} downloadInfo.downloadDate - Дата скачивания
 * @property {'url_download'} downloadInfo.method - Метод скачивания
 */
export interface UrlDownloadResult extends MediaFile {
  downloadInfo: {
    sourceUrl: string;
    category?: string;
    sizeMB: number;
    autoTagsAdded: number;
    downloadDate: string;
    method: 'url_download';
  };
}

/**
 * Интерфейс результата массового скачивания файлов по URL
 * @interface BatchDownloadResult
 * @property {number} success - Количество успешно скачанных файлов
 * @property {number} errors - Количество ошибок при скачивании
 * @property {UrlDownloadResult[]} downloadedFiles - Массив успешно скачанных файлов
 * @property {Array<{url: string, error: string}>} errorDetails - Подробности об ошибках
 * @property {object} summary - Сводная информация о процессе скачивания
 * @property {number} summary.total - Общее количество файлов
 * @property {number} summary.successful - Количество успешно обработанных файлов
 * @property {number} summary.failed - Количество неудачных попыток
 * @property {number} summary.totalSize - Общий размер всех скачанных файлов
 */
export interface BatchDownloadResult {
  success: number;
  errors: number;
  downloadedFiles: UrlDownloadResult[];
  errorDetails: Array<{
    url: string;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    totalSize: number;
  };
}

/**
 * Хук для проверки доступности URL
 *
 * @returns {UseMutationResult} Мутация для проверки URL
 *
 * @example
 * ```typescript
 * const checkUrl = useCheckUrl();
 *
 * const handleCheck = async () => {
 *   try {
 *     const result = await checkUrl.mutateAsync('https://example.com/image.jpg');
 *     console.log('URL доступен:', result.accessible);
 *   } catch (error) {
 *     console.error('Ошибка проверки URL:', error);
 *   }
 * };
 * ```
 */
export function useCheckUrl() {
  return useMutation<UrlCheckResult, Error, string>({
    mutationFn: async (url: string) => {
      return await apiRequest('POST', '/api/media/check-url', { url });
    }
  });
}

/**
 * Хук для скачивания файла по URL
 *
 * @param {number} projectId - ID проекта, в который будет добавлен файл
 * @returns {UseMutationResult} Мутация для скачивания файла по URL
 *
 * @example
 * ```typescript
 * const downloadUrl = useDownloadUrl(123);
 *
 * const handleDownload = async () => {
 *   try {
 *     const result = await downloadUrl.mutateAsync({
 *       url: 'https://example.com/image.jpg',
 *       description: 'Описание изображения',
 *       tags: 'тег1,тег2',
 *       isPublic: true
 *     });
 *     console.log('Файл успешно скачан:', result);
 *   } catch (error) {
 *     console.error('Ошибка скачивания:', error);
 *   }
 * };
 * ```
 */
export function useDownloadUrl(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation<UrlDownloadResult, Error, {
    url: string;
    description?: string;
    tags?: string;
    isPublic?: boolean;
    customFileName?: string;
  }>({
    mutationFn: async ({ url, description, tags, isPublic, customFileName }) => {
      return await apiRequest('POST', `/api/media/download-url/${projectId}`, {
        url,
        description,
        tags,
        isPublic,
        customFileName
      });
    },
    onSuccess: () => {
      // Обновляем кэш медиафайлов проекта
      queryClient.invalidateQueries({
        queryKey: ['/api/media/project', projectId]
      });
    }
  });
}

/**
 * Хук для массового скачивания файлов по URL
 *
 * @param {number} projectId - ID проекта, в который будут добавлены файлы
 * @returns {UseMutationResult} Мутация для массового скачивания файлов по URL
 *
 * @example
 * ```typescript
 * const downloadUrls = useDownloadUrls(123);
 *
 * const handleBatchDownload = async () => {
 *   try {
 *     const result = await downloadUrls.mutateAsync({
 *       urls: [
 *         'https://example.com/image1.jpg',
 *         { url: 'https://example.com/image2.png', description: 'Второе изображение' }
 *       ],
 *       isPublic: true,
 *       defaultDescription: 'Скачанный файл'
 *     });
 *     console.log(`Успешно скачано: ${result.success}, ошибок: ${result.errors}`);
 *   } catch (error) {
 *     console.error('Ошибка массового скачивания:', error);
 *   }
 * };
 * ```
 */
export function useDownloadUrls(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation<BatchDownloadResult, Error, {
    urls: Array<string | {
      url: string;
      fileName?: string;
      description?: string;
    }>;
    isPublic?: boolean;
    defaultDescription?: string;
  }>({
    mutationFn: async ({ urls, isPublic, defaultDescription }) => {
      return await apiRequest('POST', `/api/media/download-urls/${projectId}`, {
        urls,
        isPublic,
        defaultDescription
      });
    },
    onSuccess: () => {
      // Обновляем кэш медиафайлов проекта
      queryClient.invalidateQueries({
        queryKey: ['/api/media/project', projectId]
      });
    }
  });
}

/**
 * Функция для валидации URL
 * Проверяет, является ли строка допустимым HTTP или HTTPS URL
 *
 * @param {string} string - Строка для проверки
 * @returns {boolean} true, если строка является допустимым URL, иначе false
 *
 * @example
 * ```typescript
 * console.log(isValidUrl('https://example.com')); // true
 * console.log(isValidUrl('ftp://example.com')); // false
 * console.log(isValidUrl('invalid-url')); // false
 * ```
 */
export function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

/**
 * Функция для извлечения имени файла из URL
 * Извлекает имя файла из последнего сегмента пути URL
 *
 * @param {string} url - URL для извлечения имени файла
 * @returns {string} Имя файла или 'downloaded-file', если не удалось извлечь
 *
 * @example
 * ```typescript
 * console.log(extractFileNameFromUrl('https://example.com/images/photo.jpg')); // 'photo.jpg'
 * console.log(extractFileNameFromUrl('https://example.com/docs/')); // 'downloaded-file'
 * ```
 */
export function extractFileNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const segments = pathname.split('/');
    const fileName = segments[segments.length - 1];

    // Если есть расширение файла, возвращаем имя файла
    if (fileName && fileName.includes('.')) {
      return fileName;
    }

    // Если нет расширения, пытаемся определить по Content-Disposition в заголовках
    return fileName || 'downloaded-file';
  } catch {
    return 'downloaded-file';
  }
}

/**
 * Функция для определения типа файла по URL
 * Определяет тип файла на основе расширения в имени файла
 *
 * @param {string} url - URL файла для определения типа
 * @returns {'photo' | 'video' | 'audio' | 'document' | 'unknown'} Тип файла
 *
 * @example
 * ```typescript
 * console.log(getFileTypeFromUrl('https://example.com/image.jpg')); // 'photo'
 * console.log(getFileTypeFromUrl('https://example.com/video.mp4')); // 'video'
 * console.log(getFileTypeFromUrl('https://example.com/document.pdf')); // 'document'
 * console.log(getFileTypeFromUrl('https://example.com/file.xyz')); // 'unknown'
 * ```
 */
export function getFileTypeFromUrl(url: string): 'photo' | 'video' | 'audio' | 'document' | 'unknown' {
  const fileName = extractFileNameFromUrl(url).toLowerCase();

  // Изображения
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(fileName)) {
    return 'photo';
  }

  // Видео
  if (/\.(mp4|webm|avi|mov|mkv|flv|wmv)$/i.test(fileName)) {
    return 'video';
  }

  // Аудио
  if (/\.(mp3|wav|ogg|aac|flac|m4a)$/i.test(fileName)) {
    return 'audio';
  }

  // Документы
  if (/\.(pdf|doc|docx|txt|xls|xlsx|ppt|pptx|zip|rar)$/i.test(fileName)) {
    return 'document';
  }

  return 'unknown';
}

/**
 * Функция для форматирования размера файла
 * Преобразует размер в байтах в человекочитаемый формат
 *
 * @param {number} [bytes] - Размер файла в байтах
 * @returns {string} Отформатированный размер файла с единицами измерения
 *
 * @example
 * ```typescript
 * console.log(formatFileSize()); // '0 Б'
 * console.log(formatFileSize(1024)); // '1.0 КБ'
 * console.log(formatFileSize(1048576)); // '1.0 МБ'
 * ```
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes) return '0 Б';

  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const formattedSize = (bytes / Math.pow(1024, i)).toFixed(1);

  return `${formattedSize} ${sizes[i]}`;
}

/**
 * Функция для проверки поддерживаемых типов файлов
 * Проверяет, является ли тип файла поддерживаемым системой
 *
 * @param {string} url - URL файла для проверки
 * @returns {boolean} true, если тип файла поддерживается, иначе false
 *
 * @example
 * ```typescript
 * console.log(isSupportedFileType('https://example.com/image.jpg')); // true
 * console.log(isSupportedFileType('https://example.com/file.xyz')); // false
 * ```
 */
export function isSupportedFileType(url: string): boolean {
  const fileType = getFileTypeFromUrl(url);
  return fileType !== 'unknown';
}
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { MediaFile } from "@shared/schema";

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

export function useCheckUrl() {
  return useMutation<UrlCheckResult, Error, string>({
    mutationFn: async (url: string) => {
      return await apiRequest('/api/media/check-url', {
        method: 'POST',
        body: { url }
      });
    }
  });
}

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
      return await apiRequest(`/api/media/download-url/${projectId}`, {
        method: 'POST',
        body: { 
          url, 
          description, 
          tags, 
          isPublic, 
          customFileName 
        }
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
      return await apiRequest(`/api/media/download-urls/${projectId}`, {
        method: 'POST',
        body: { 
          urls, 
          isPublic, 
          defaultDescription 
        }
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

// Функция для валидации URL
export function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

// Функция для извлечения имени файла из URL
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

// Функция для определения типа файла по URL
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

// Функция для форматирования размера файла
export function formatFileSize(bytes?: number): string {
  if (!bytes) return '0 Б';
  
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const formattedSize = (bytes / Math.pow(1024, i)).toFixed(1);
  
  return `${formattedSize} ${sizes[i]}`;
}

// Функция для проверки поддерживаемых типов файлов
export function isSupportedFileType(url: string): boolean {
  const fileType = getFileTypeFromUrl(url);
  return fileType !== 'unknown';
}
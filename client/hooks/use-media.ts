import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { MediaFile, InsertMediaFile } from "@shared/schema";

/**
 * Хук для получения списка медиафайлов проекта
 *
 * @param {number} projectId - ID проекта
 * @param {string} [fileType] - Тип файла для фильтрации (опционально)
 * @returns {UseQueryResult} Результат запроса с медиафайлами
 *
 * @example
 * ```typescript
 * const { data: mediaFiles, isLoading, error } = useMediaFiles(123, 'image');
 * ```
 */
export function useMediaFiles(projectId: number, fileType?: string) {
  return useQuery({
    queryKey: ["/api/media/project", projectId, fileType],
    enabled: !!projectId && typeof projectId === 'number',
    queryFn: async (): Promise<MediaFile[]> => {
      const url = fileType
        ? `/api/media/project/${projectId}?type=${fileType}`
        : `/api/media/project/${projectId}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Ошибка при загрузке медиафайлов");
      }
      return response.json();
    },
  });
}

/**
 * Хук для загрузки одного медиафайла
 *
 * @param {number} projectId - ID проекта, в который загружается файл
 * @returns {UseMutationResult} Мутация для загрузки файла
 *
 * @example
 * ```typescript
 * const uploadMedia = useUploadMedia(123);
 *
 * const handleUpload = async (file: File) => {
 *   try {
 *     const result = await uploadMedia.mutateAsync({
 *       file,
 *       description: 'Описание файла',
 *       tags: ['тег1', 'тег2'],
 *       isPublic: true,
 *       onProgress: (progress) => console.log(`Загрузка: ${progress}%`)
 *     });
 *     console.log('Файл успешно загружен:', result);
 *   } catch (error) {
 *     console.error('Ошибка загрузки:', error);
 *   }
 * };
 * ```
 */
export function useUploadMedia(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      description,
      tags,
      isPublic,
      onProgress
    }: {
      file: File;
      description?: string;
      tags?: string[];
      isPublic?: boolean;
      onProgress?: (progress: number) => void;
    }): Promise<MediaFile> => {
      const formData = new FormData();
      formData.append('file', file);
      if (description) formData.append('description', description);
      if (tags) formData.append('tags', tags.join(','));
      if (isPublic !== undefined) formData.append('isPublic', isPublic.toString());

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Обработчик прогресса загрузки
        if (onProgress) {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              onProgress(progress);
            }
          });
        }

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result);
            } catch (parseError) {
              console.error('Parse error:', parseError, 'Response:', xhr.responseText);
              reject(new Error('Ошибка при обработке ответа сервера'));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              console.error('Upload error:', error);
              reject(new Error(error.message || `Ошибка при загрузке файла (${xhr.status})`));
            } catch (parseError) {
              console.error('Error parsing error response:', parseError, 'Response:', xhr.responseText);
              reject(new Error(`Ошибка сервера: ${xhr.status} - ${xhr.statusText}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Ошибка сети при загрузке файла'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Загрузка файла была прервана'));
        });

        xhr.open('POST', `/api/media/upload/${projectId}`);
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media/project", projectId] });
    },
  });
}

/**
 * Хук для загрузки нескольких медиафайлов
 *
 * @param {number} projectId - ID проекта, в который загружаются файлы
 * @returns {UseMutationResult} Мутация для загрузки нескольких файлов
 *
 * @example
 * ```typescript
 * const uploadMultipleMedia = useUploadMultipleMedia(123);
 *
 * const handleMultipleUpload = async (files: File[]) => {
 *   try {
 *     const result = await uploadMultipleMedia.mutateAsync({
 *       files,
 *       defaultDescription: 'Общее описание',
 *       isPublic: true,
 *       onProgress: (progress) => console.log(`Общий прогресс: ${progress}%`)
 *     });
 *     console.log(`Загружено файлов: ${result.success}, ошибок: ${result.errors}`);
 *   } catch (error) {
 *     console.error('Ошибка массовой загрузки:', error);
 *   }
 * };
 * ```
 */
export function useUploadMultipleMedia(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      files,
      defaultDescription,
      isPublic,
      onProgress    }: {
      files: File[];
      defaultDescription?: string;
      isPublic?: boolean;
      onProgress?: (progress: number) => void;
      onFileProgress?: (fileIndex: number, progress: number) => void;
    }): Promise<{
      success: number;
      errors: number;
      uploadedFiles: MediaFile[];
      errorDetails: any[];
      statistics: any;
    }> => {
      const formData = new FormData();

      files.forEach(file => {
        formData.append('files', file);
      });

      if (defaultDescription) formData.append('defaultDescription', defaultDescription);
      if (isPublic !== undefined) formData.append('isPublic', isPublic.toString());

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Обработчик прогресса загрузки
        if (onProgress) {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              onProgress(progress);
            }
          });
        }

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result);
            } catch (parseError) {
              console.error('Multiple upload parse error:', parseError, 'Response:', xhr.responseText);
              reject(new Error('Ошибка при обработке ответа сервера'));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              console.error('Multiple upload error:', error);
              reject(new Error(error.message || `Ошибка при загрузке файлов (${xhr.status})`));
            } catch (parseError) {
              console.error('Error parsing multiple upload error response:', parseError, 'Response:', xhr.responseText);
              reject(new Error(`Ошибка сервера: ${xhr.status} - ${xhr.statusText}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Ошибка сети при загрузке файлов'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Загрузка файлов была прервана'));
        });

        xhr.open('POST', `/api/media/upload-multiple/${projectId}`);
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media/project", projectId] });
    },
  });
}

/**
 * Хук для удаления медиафайла
 *
 * @returns {UseMutationResult} Мутация для удаления файла
 *
 * @example
 * ```typescript
 * const deleteMedia = useDeleteMedia();
 *
 * const handleDelete = async (fileId: number) => {
 *   try {
 *     await deleteMedia.mutateAsync(fileId);
 *     console.log('Файл успешно удален');
 *   } catch (error) {
 *     console.error('Ошибка удаления:', error);
 *   }
 * };
 * ```
 */
export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const response = await apiRequest('DELETE', `/api/media/${id}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка при удалении файла');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media/project"] });
    },
  });
}

/**
 * Хук для обновления информации о медиафайле
 *
 * @returns {UseMutationResult} Мутация для обновления файла
 *
 * @example
 * ```typescript
 * const updateMedia = useUpdateMedia();
 *
 * const handleUpdate = async (fileId: number, updates: Partial<InsertMediaFile>) => {
 *   try {
 *     const updatedFile = await updateMedia.mutateAsync({
 *       id: fileId,
 *       updates
 *     });
 *     console.log('Файл успешно обновлен:', updatedFile);
 *   } catch (error) {
 *     console.error('Ошибка обновления:', error);
 *   }
 * };
 * ```
 */
export function useUpdateMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: number;
      updates: Partial<InsertMediaFile>
    }): Promise<MediaFile> => {
      const response = await apiRequest('PUT', `/api/media/${id}`, updates);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка при обновлении файла');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media/project"] });
    },
  });
}

/**
 * Хук для увеличения счетчика использования медиафайла
 *
 * @returns {UseMutationResult} Мутация для увеличения счетчика использования
 *
 * @example
 * ```typescript
 * const incrementUsage = useIncrementUsage();
 *
 * const handleIncrement = async (fileId: number) => {
 *   try {
 *     await incrementUsage.mutateAsync(fileId);
 *     console.log('Счетчик использования увеличен');
 *   } catch (error) {
 *     console.error('Ошибка увеличения счетчика:', error);
 *   }
 * };
 * ```
 */
export function useIncrementUsage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const response = await apiRequest('POST', `/api/media/${id}/use`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка при обновлении использования');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media/project"] });
    },
  });
}

/**
 * Хук для поиска медиафайлов в проекте
 *
 * @param {number} projectId - ID проекта для поиска
 * @param {string} query - Поисковый запрос
 * @returns {UseQueryResult} Результат запроса с найденными медиафайлами
 *
 * @example
 * ```typescript
 * const { data: searchResults, isLoading, error } = useSearchMedia(123, 'фото кота');
 * ```
 */
export function useSearchMedia(projectId: number, query: string) {
  return useQuery({
    queryKey: ["/api/media/search", projectId, query],
    queryFn: async (): Promise<MediaFile[]> => {
      if (!query.trim()) return [];

      const response = await fetch(`/api/media/search/${projectId}?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error("Ошибка при поиске файлов");
      }
      return response.json();
    },
    enabled: !!query.trim() && !!projectId && typeof projectId === 'number',
  });
}
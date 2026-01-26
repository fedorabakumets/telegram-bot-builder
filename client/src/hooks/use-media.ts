import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { MediaFile, InsertMediaFile } from "@shared/schema";

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

export function useUploadMultipleMedia(projectId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      files, 
      defaultDescription, 
      isPublic,
      onProgress,
      onFileProgress
    }: { 
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { MediaFile, InsertMediaFile } from "@shared/schema";

export function useMediaFiles(projectId: number, fileType?: string) {
  return useQuery({
    queryKey: ["/api/media/project", projectId, fileType],
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
    mutationFn: async ({ file, description, tags }: { 
      file: File; 
      description?: string; 
      tags?: string[] 
    }): Promise<MediaFile> => {
      const formData = new FormData();
      formData.append('file', file);
      if (description) formData.append('description', description);
      if (tags) formData.append('tags', tags.join(','));
      
      const response = await fetch(`/api/media/upload/${projectId}`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка при загрузке файла');
      }
      
      return response.json();
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
      const response = await apiRequest(`/api/media/${id}`, {
        method: 'DELETE',
      });
      
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
      const response = await apiRequest(`/api/media/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
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
      const response = await apiRequest(`/api/media/${id}/use`, {
        method: 'POST',
      });
      
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
    enabled: !!query.trim(),
  });
}
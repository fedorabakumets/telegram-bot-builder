import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { BotTemplate } from '@shared/schema';

interface UseTemplatesOptions {
  category?: 'all' | 'featured' | 'custom';
  enabled?: boolean;
}

interface CreateTemplateData {
  name: string;
  description?: string;
  category?: string;
  data: any;
  isPublic?: boolean;
}

interface UpdateTemplateData {
  name?: string;
  description?: string;
  category?: string;
  data?: any;
  isPublic?: boolean;
}

/**
 * Hook for managing bot templates
 * Provides standardized error handling, loading states, and caching
 */
export function useTemplates(options: UseTemplatesOptions = {}) {
  const { category = 'all', enabled = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get templates based on category
  const getQueryKey = () => {
    switch (category) {
      case 'featured':
        return ['/api/templates/featured'];
      case 'custom':
        return ['/api/templates/category/custom'];
      default:
        return ['/api/templates'];
    }
  };

  const {
    data: templates = [],
    isLoading,
    error,
    refetch
  } = useQuery<BotTemplate[]>({
    queryKey: getQueryKey(),
    enabled,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Create template from bot
  const createTemplateMutation = useMutation({
    mutationFn: async (data: CreateTemplateData) => {
      return apiRequest('POST', '/api/templates', data);
    },
    onSuccess: (newTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/templates/category/custom'] });
      toast({
        title: 'Шаблон создан',
        description: `Шаблон "${newTemplate.name}" успешно создан`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка создания',
        description: error.message || 'Не удалось создать шаблон',
        variant: 'destructive',
      });
    },
  });

  // Update template
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateTemplateData }) => {
      return apiRequest('PUT', `/api/templates/${id}`, data);
    },
    onSuccess: (updatedTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/templates/category/custom'] });
      toast({
        title: 'Шаблон обновлен',
        description: 'Изменения сохранены',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка сохранения',
        description: error.message || 'Не удалось сохранить изменения',
        variant: 'destructive',
      });
    },
  });

  // Delete template
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/templates/category/custom'] });
      toast({
        title: 'Шаблон удален',
        description: 'Шаблон успешно удален',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка удаления',
        description: error.message || 'Не удалось удалить шаблон',
        variant: 'destructive',
      });
    },
  });

  // Use template (create bot from template)
  const useTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/templates/${id}/use`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to use template');
      return response.json();
    },
    onSuccess: (newBot) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects/list'] });
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: 'Бот создан',
        description: `Проект "${newBot.name}" создан из шаблона`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка создания',
        description: error.message || 'Не удалось создать бот из шаблона',
        variant: 'destructive',
      });
    },
  });

  // Rate template
  const rateTemplateMutation = useMutation({
    mutationFn: async ({ id, rating }: { id: number; rating: number }) => {
      const response = await fetch(`/api/templates/${id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to rate template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: 'Спасибо за оценку!',
        description: 'Ваша оценка учтена',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка оценки',
        description: error.message || 'Не удалось поставить оценку',
        variant: 'destructive',
      });
    },
  });

  // Like template
  const likeTemplateMutation = useMutation({
    mutationFn: async ({ id, liked }: { id: number; liked: boolean }) => {
      const response = await fetch(`/api/templates/${id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liked }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to like template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: 'Отлично!',
        description: 'Ваша реакция учтена',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось поставить лайк',
        variant: 'destructive',
      });
    },
  });

  // Bookmark template
  const bookmarkTemplateMutation = useMutation({
    mutationFn: async ({ id, bookmarked }: { id: number; bookmarked: boolean }) => {
      const response = await fetch(`/api/templates/${id}/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarked }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to bookmark template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: 'Готово!',
        description: 'Закладка обновлена',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось обновить закладку',
        variant: 'destructive',
      });
    },
  });

  // Download template
  const downloadTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/templates/${id}/download`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to download template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка загрузки',
        description: error.message || 'Не удалось скачать шаблон',
        variant: 'destructive',
      });
    },
  });

  return {
    // Data
    templates,
    isLoading,
    error,
    
    // Actions
    refetch,
    createTemplate: createTemplateMutation.mutateAsync,
    updateTemplate: updateTemplateMutation.mutateAsync,
    deleteTemplate: deleteTemplateMutation.mutateAsync,
    useTemplate: useTemplateMutation.mutateAsync,
    rateTemplate: rateTemplateMutation.mutateAsync,
    likeTemplate: likeTemplateMutation.mutateAsync,
    bookmarkTemplate: bookmarkTemplateMutation.mutateAsync,
    downloadTemplate: downloadTemplateMutation.mutateAsync,
    
    // Mutation states
    isCreating: createTemplateMutation.isPending,
    isUpdating: updateTemplateMutation.isPending,
    isDeleting: deleteTemplateMutation.isPending,
    isUsing: useTemplateMutation.isPending,
    isRating: rateTemplateMutation.isPending,
    isLiking: likeTemplateMutation.isPending,
    isBookmarking: bookmarkTemplateMutation.isPending,
    isDownloading: downloadTemplateMutation.isPending,
  };
}

/**
 * Hook for getting individual template data
 */
export function useTemplate(id: number, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  const {
    data: template,
    isLoading,
    error,
    refetch
  } = useQuery<BotTemplate>({
    queryKey: [`/api/templates/${id}`],
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    template,
    isLoading,
    error,
    refetch,
  };
}
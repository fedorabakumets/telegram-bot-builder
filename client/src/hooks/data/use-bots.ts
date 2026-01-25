import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { BotProject, BotData } from '@shared/schema';

interface UseBotsOptions {
  enabled?: boolean;
}

interface CreateBotData {
  name: string;
  description?: string;
  data?: BotData;
}

interface UpdateBotData {
  name?: string;
  description?: string;
  data?: BotData;
}

/**
 * Hook for managing bot projects data
 * Provides standardized error handling, loading states, and caching
 */
export function useBots(options: UseBotsOptions = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get guest project IDs from localStorage
  const getGuestProjectIds = () => {
    if (typeof window === 'undefined') return '';
    const myProjectIds = localStorage.getItem('myProjectIds') || '';
    return myProjectIds;
  };

  // Build query URL with guest project IDs if needed
  const buildQueryUrl = () => {
    const guestIds = getGuestProjectIds();
    // Только добавляем параметр ids если есть реальные ID
    if (guestIds && guestIds.trim()) {
      return `/api/projects/list?ids=${guestIds}`;
    }
    return '/api/projects/list';
  };

  // Get list of bot projects (metadata only)
  const {
    data: bots = [],
    isLoading,
    error,
    refetch
  } = useQuery<BotProject[]>({
    queryKey: [buildQueryUrl()],
    enabled,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Create new bot project
  const createBotMutation = useMutation({
    mutationFn: async (data: CreateBotData) => {
      return apiRequest('POST', '/api/projects', data);
    },
    onSuccess: (newBot) => {
      // Save project ID to localStorage for guests
      if (typeof window !== 'undefined') {
        const myProjectIds = localStorage.getItem('myProjectIds') || '';
        const ids = new Set(myProjectIds.split(',').filter(Boolean).map(Number));
        ids.add(newBot.id);
        localStorage.setItem('myProjectIds', Array.from(ids).join(','));
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/projects/list'] });
      // Also invalidate the query with IDs
      const guestIds = getGuestProjectIds();
      if (guestIds) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/list?ids=${guestIds}`] });
      }
      
      toast({
        title: 'Бот создан',
        description: `Проект "${newBot.name}" успешно создан`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка создания',
        description: error.message || 'Не удалось создать бот',
        variant: 'destructive',
      });
    },
  });

  // Update bot project
  const updateBotMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBotData }) => {
      return apiRequest('PUT', `/api/projects/${id}`, data);
    },
    onSuccess: (updatedBot) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects/list'] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${updatedBot.id}`] });
      // Also invalidate the query with IDs
      const guestIds = getGuestProjectIds();
      if (guestIds) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/list?ids=${guestIds}`] });
      }
      
      toast({
        title: 'Бот обновлен',
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

  // Delete bot project
  const deleteBotMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/projects/${id}`);
    },
    onSuccess: (_, deletedId) => {
      // Remove project ID from localStorage for guests
      if (typeof window !== 'undefined') {
        const myProjectIds = localStorage.getItem('myProjectIds') || '';
        const ids = new Set(myProjectIds.split(',').filter(Boolean).map(Number));
        ids.delete(parseInt(deletedId));
        localStorage.setItem('myProjectIds', Array.from(ids).join(','));
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/projects/list'] });
      // Also invalidate the query with IDs
      const guestIds = getGuestProjectIds();
      if (guestIds) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/list?ids=${guestIds}`] });
      }
      
      toast({
        title: 'Бот удален',
        description: 'Проект успешно удален',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка удаления',
        description: error.message || 'Не удалось удалить бот',
        variant: 'destructive',
      });
    },
  });

  // Duplicate bot project
  const duplicateBotMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('POST', `/api/projects/${id}/duplicate`);
    },
    onSuccess: (duplicatedBot) => {
      // Save duplicated project ID to localStorage for guests
      if (typeof window !== 'undefined') {
        const myProjectIds = localStorage.getItem('myProjectIds') || '';
        const ids = new Set(myProjectIds.split(',').filter(Boolean).map(Number));
        ids.add(duplicatedBot.id);
        localStorage.setItem('myProjectIds', Array.from(ids).join(','));
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/projects/list'] });
      // Also invalidate the query with IDs
      const guestIds = getGuestProjectIds();
      if (guestIds) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/list?ids=${guestIds}`] });
      }
      
      toast({
        title: 'Бот скопирован',
        description: `Создана копия "${duplicatedBot.name}"`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка копирования',
        description: error.message || 'Не удалось скопировать бот',
        variant: 'destructive',
      });
    },
  });

  return {
    // Data
    bots,
    isLoading,
    error,
    
    // Actions
    refetch,
    createBot: createBotMutation.mutateAsync,
    updateBot: updateBotMutation.mutateAsync,
    deleteBot: deleteBotMutation.mutateAsync,
    duplicateBot: duplicateBotMutation.mutateAsync,
    
    // Mutation states
    isCreating: createBotMutation.isPending,
    isUpdating: updateBotMutation.isPending,
    isDeleting: deleteBotMutation.isPending,
    isDuplicating: duplicateBotMutation.isPending,
  };
}

/**
 * Hook for managing individual bot project data
 */
export function useBot(id: string, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get full bot project data
  const {
    data: bot,
    isLoading,
    error,
    refetch
  } = useQuery<BotProject>({
    queryKey: [`/api/projects/${id}`],
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Save bot data
  const saveBotMutation = useMutation({
    mutationFn: async (data: BotData) => {
      return apiRequest('PUT', `/api/projects/${id}`, { data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects/list'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка сохранения',
        description: error.message || 'Не удалось сохранить изменения',
        variant: 'destructive',
      });
    },
  });

  return {
    // Data
    bot,
    isLoading,
    error,
    
    // Actions
    refetch,
    saveBot: saveBotMutation.mutateAsync,
    
    // Mutation states
    isSaving: saveBotMutation.isPending,
  };
}
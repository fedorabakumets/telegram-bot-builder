import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  auth_date?: number;
  hash?: string;
}

interface UserProfile {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
  settings?: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    notifications?: boolean;
  };
}

interface UpdateUserData {
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  settings?: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    notifications?: boolean;
  };
}

/**
 * Hook for managing user authentication and profile data
 * Provides standardized error handling, loading states, and caching
 */
export function useUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get current user data (returns null if not authenticated)
  const {
    data: user,
    isLoading,
    error,
    refetch
  } = useQuery<User | null>({
    queryKey: ['/api/user'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on auth errors
  });

  // Get user profile (extended user data)
  const {
    data: profile,
    isLoading: isLoadingProfile,
    error: profileError,
    refetch: refetchProfile
  } = useQuery<UserProfile | null>({
    queryKey: ['/api/user/profile'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: !!user, // Only fetch if user is authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update user profile
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateUserData) => {
      return apiRequest('PUT', '/api/user/profile', data);
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['/api/user/profile'], updatedProfile);
      toast({
        title: 'Профиль обновлен',
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

  // Logout user
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/auth/logout');
    },
    onSuccess: () => {
      // Clear all user-related cache
      queryClient.setQueryData(['/api/user'], null);
      queryClient.setQueryData(['/api/user/profile'], null);
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/templates/category/custom'] });
      
      toast({
        title: 'Выход выполнен',
        description: 'Вы успешно вышли из системы',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка выхода',
        description: error.message || 'Не удалось выйти из системы',
        variant: 'destructive',
      });
    },
  });

  // Delete user account
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', '/api/user/account');
    },
    onSuccess: () => {
      // Clear all cache
      queryClient.clear();
      
      toast({
        title: 'Аккаунт удален',
        description: 'Ваш аккаунт был успешно удален',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка удаления',
        description: error.message || 'Не удалось удалить аккаунт',
        variant: 'destructive',
      });
    },
  });

  // Computed values
  const isAuthenticated = !!user;
  const isGuest = !user;
  const displayName = user?.first_name || user?.username || 'Пользователь';
  const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '';

  return {
    // Data
    user,
    profile,
    isAuthenticated,
    isGuest,
    displayName,
    fullName,
    
    // Loading states
    isLoading,
    isLoadingProfile,
    
    // Errors
    error,
    profileError,
    
    // Actions
    refetch,
    refetchProfile,
    updateProfile: updateProfileMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    deleteAccount: deleteAccountMutation.mutateAsync,
    
    // Mutation states
    isUpdatingProfile: updateProfileMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isDeletingAccount: deleteAccountMutation.isPending,
  };
}

/**
 * Hook for user settings management
 */
export function useUserSettings() {
  const { profile, updateProfile, isUpdatingProfile } = useUser();
  const { toast } = useToast();

  const settings = profile?.settings || {};

  const updateSettings = async (newSettings: Partial<UpdateUserData['settings']>) => {
    try {
      await updateProfile({
        settings: {
          ...settings,
          ...newSettings,
        },
      });
    } catch (error: any) {
      toast({
        title: 'Ошибка настроек',
        description: error.message || 'Не удалось сохранить настройки',
        variant: 'destructive',
      });
    }
  };

  return {
    settings,
    updateSettings,
    isUpdating: isUpdatingProfile,
  };
}
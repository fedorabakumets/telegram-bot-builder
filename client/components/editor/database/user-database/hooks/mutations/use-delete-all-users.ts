/**
 * @fileoverview Мутация удаления всех пользователей
 * @description Хук для очистки всей базы данных пользователей проекта
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

/**
 * Параметры хука useDeleteAllUsers
 */
interface UseDeleteAllUsersParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Функция обновления списка пользователей */
  refetchUsers: () => void;
  /** Функция обновления статистики */
  refetchStats: () => void;
}

/**
 * Хук для удаления всех пользователей
 * @param params - Параметры хука
 * @returns Мутация удаления всех пользователей
 */
export function useDeleteAllUsers(params: UseDeleteAllUsersParams) {
  const { projectId, refetchUsers, refetchStats } = params;
  const { toast } = useToast();
  const qClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      console.log(`Attempting to delete all users for project: ${projectId}`);
      return apiRequest('DELETE', `/api/projects/${projectId}/users`);
    },
    onSuccess: (data) => {
      console.log('Bulk deletion successful:', data);
      qClient.removeQueries({ queryKey: [`/api/projects/${projectId}/users`] });
      qClient.removeQueries({ queryKey: [`/api/projects/${projectId}/users/stats`] });

      setTimeout(() => {
        refetchUsers();
        refetchStats();
      }, 100);

      const deletedCount = data?.deletedCount || 0;
      toast({
        title: 'База данных очищена',
        description: `Удалено записей: ${deletedCount}. Все пользовательские данные удалены.`,
      });
    },
    onError: (error) => {
      console.error('Bulk deletion failed:', error);
      toast({
        title: 'Ошибка очистки базы',
        description: 'Не удалось очистить базу данных. Проверьте консоль для подробностей.',
        variant: 'destructive',
      });
    },
  });
}

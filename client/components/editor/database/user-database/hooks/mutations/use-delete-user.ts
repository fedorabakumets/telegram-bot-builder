/**
 * @fileoverview Мутация удаления пользователя
 * @description Хук для удаления одного пользователя из базы данных
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

/**
 * Параметры хука useDeleteUser
 */
interface UseDeleteUserParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Функция обновления списка пользователей */
  refetchUsers: () => void;
  /** Функция обновления статистики */
  refetchStats: () => void;
}

/**
 * Хук для удаления пользователя
 * @param params - Параметры хука
 * @returns Мутация удаления пользователя
 */
export function useDeleteUser(params: UseDeleteUserParams) {
  const { projectId, refetchUsers, refetchStats } = params;
  const { toast } = useToast();
  const qClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => {
      console.log(`Attempting to delete user with ID: ${userId}`);
      return apiRequest('DELETE', `/api/users/${userId}`);
    },
    onSuccess: (data) => {
      console.log('User deletion successful:', data);
      qClient.removeQueries({ queryKey: [`/api/projects/${projectId}/users`] });
      qClient.removeQueries({ queryKey: [`/api/projects/${projectId}/users/stats`] });

      setTimeout(() => {
        refetchUsers();
        refetchStats();
      }, 100);

      toast({
        title: 'Пользователь удален',
        description: 'Данные пользователя успешно удалены',
      });
    },
    onError: (error) => {
      console.error('User deletion failed:', error);
      toast({
        title: 'Ошибка удаления',
        description: 'Не удалось удалить пользователя. Проверьте консоль для подробностей.',
        variant: 'destructive',
      });
    },
  });
}

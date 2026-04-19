/**
 * @fileoverview Мутация удаления пользователя
 * @description Хук для удаления одного пользователя из базы данных
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';

/**
 * Параметры хука useDeleteUser
 */
interface UseDeleteUserParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
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
  const { projectId, selectedTokenId, refetchUsers, refetchStats } = params;
  const usersQueryKey = buildUsersApiUrl(`/api/projects/${projectId}/users`, selectedTokenId);
  const statsQueryKey = buildUsersApiUrl(`/api/projects/${projectId}/users/stats`, selectedTokenId);
  const { toast } = useToast();
  const qClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) =>
      apiRequest('DELETE', `/api/users/${userId}`, {
        projectId,
        tokenId: selectedTokenId ?? null,
      }),
    onSuccess: () => {
      qClient.removeQueries({ queryKey: [usersQueryKey, selectedTokenId] });
      qClient.removeQueries({ queryKey: [statsQueryKey, selectedTokenId] });

      setTimeout(() => {
        refetchUsers();
        refetchStats();
      }, 100);

      toast({
        title: 'Пользователь удалён',
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

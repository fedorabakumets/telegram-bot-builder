/**
 * @fileoverview Мутация обновления данных пользователя
 * @description Хук для обновления статуса пользователя с учётом выбранного токена
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserBotData } from '@shared/schema';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';

/**
 * Параметры хука useUpdateUser
 */
interface UseUpdateUserParams {
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
 * Хук для обновления данных пользователя
 * @param params - Параметры хука
 * @returns Мутация обновления пользователя
 */
export function useUpdateUser(params: UseUpdateUserParams) {
  const { projectId, selectedTokenId, refetchUsers, refetchStats } = params;
  const usersQueryKey = buildUsersApiUrl(`/api/projects/${projectId}/users`, selectedTokenId);
  const statsQueryKey = buildUsersApiUrl(`/api/projects/${projectId}/users/stats`, selectedTokenId);
  const { toast } = useToast();
  const qClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: Partial<UserBotData> }) => {
      const normalizedData = {
        ...data,
        projectId,
        tokenId: selectedTokenId ?? null,
        ...(data.isActive !== undefined && { isActive: data.isActive ? 1 : 0 }),
        ...(data.isBlocked !== undefined && { isBlocked: data.isBlocked ? 1 : 0 }),
        ...(data.isPremium !== undefined && { isPremium: data.isPremium ? 1 : 0 }),
      };

      return apiRequest('PUT', `/api/users/${userId}`, normalizedData);
    },
    onSuccess: () => {
      qClient.removeQueries({ queryKey: [usersQueryKey, selectedTokenId] });
      qClient.removeQueries({ queryKey: [statsQueryKey, selectedTokenId] });

      setTimeout(() => {
        refetchUsers();
        refetchStats();
      }, 100);

      toast({
        title: 'Статус изменён',
        description: 'Статус пользователя успешно обновлён',
      });
    },
    onError: () => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить статус пользователя',
        variant: 'destructive',
      });
    },
  });
}

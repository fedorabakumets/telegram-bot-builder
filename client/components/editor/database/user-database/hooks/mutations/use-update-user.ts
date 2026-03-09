/**
 * @fileoverview Мутация обновления данных пользователя
 * @description Хук для обновления статуса пользователя (isActive, isBlocked, isPremium)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { UserBotData } from '@shared/schema';

/**
 * Параметры хука useUpdateUser
 */
interface UseUpdateUserParams {
  /** Идентификатор проекта */
  projectId: number;
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
  const { projectId, refetchUsers, refetchStats } = params;
  const { toast } = useToast();
  const qClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: Partial<UserBotData> }) => {
      const normalizedData = {
        ...data,
        ...(data.isActive !== undefined && { isActive: data.isActive ? 1 : 0 }),
        ...(data.isBlocked !== undefined && { isBlocked: data.isBlocked ? 1 : 0 }),
        ...(data.isPremium !== undefined && { isPremium: data.isPremium ? 1 : 0 }),
      };
      return apiRequest('PUT', `/api/users/${userId}`, normalizedData);
    },
    onSuccess: () => {
      qClient.removeQueries({ queryKey: [`/api/projects/${projectId}/users`] });
      qClient.removeQueries({ queryKey: [`/api/projects/${projectId}/users/stats`] });

      setTimeout(() => {
        refetchUsers();
        refetchStats();
      }, 100);

      toast({
        title: 'Статус изменен',
        description: 'Статус пользователя успешно обновлен',
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

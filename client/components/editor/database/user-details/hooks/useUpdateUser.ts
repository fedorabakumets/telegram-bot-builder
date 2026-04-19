/**
 * @fileoverview Хук обновления данных пользователя
 * @description Реализует мутацию для обновления пользователя через API
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserBotData } from '@shared/schema';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';

/**
 * Мутация обновления данных пользователя
 * @param projectId - Идентификатор проекта
 * @param selectedTokenId - Идентификатор выбранного токена
 * @param user - Данные пользователя
 * @returns Мутация обновления
 */
export function useUpdateUser(
  projectId: number,
  selectedTokenId: number | null | undefined,
  user: UserBotData | null
) {
  const { toast } = useToast();
  const qClient = useQueryClient();
  const usersQueryKey = buildUsersApiUrl(`/api/projects/${projectId}/users`, selectedTokenId);
  const statsQueryKey = buildUsersApiUrl(`/api/projects/${projectId}/users/stats`, selectedTokenId);
  const searchQueryKey = buildUsersApiUrl(`/api/projects/${projectId}/users/search`, selectedTokenId);

  return useMutation({
    mutationFn: async (updates: Partial<UserBotData>) => {
      if (!user) {
        throw new Error('Пользователь не выбран');
      }

      return apiRequest('PUT', `/api/users/${user.userId}`, {
        ...updates,
        projectId,
        tokenId: selectedTokenId ?? null,
      });
    },
    onSuccess: () => {
      qClient.invalidateQueries({ queryKey: [usersQueryKey, selectedTokenId] });
      qClient.invalidateQueries({ queryKey: [statsQueryKey, selectedTokenId] });
      qClient.invalidateQueries({ queryKey: [searchQueryKey, selectedTokenId] });
      toast({
        title: 'Сохранено',
        description: 'Данные пользователя обновлены',
      });
    },
    onError: (error: any) => {
      console.error('Ошибка обновления пользователя:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить данные',
        variant: 'destructive',
      });
    }
  });
}

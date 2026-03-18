/**
 * @fileoverview Хук обновления данных пользователя
 * @description Реализует мутацию для обновления пользователя через API
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';
import { UserBotData } from '@shared/schema';

/**
 * Мутация обновления данных пользователя
 * @param {number} projectId - Идентификатор проекта
 * @param {UserBotData | null} user - Данные пользователя
 * @returns {ReturnType<typeof useMutation>} Мутация обновления
 */
export function useUpdateUser(projectId: number, user: UserBotData | null) {
  const { toast } = useToast();
  const qClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<UserBotData>) => {
      if (!user) throw new Error('Пользователь не выбран');
      return apiRequest('PUT', `/api/users/${user.userId}`, updates);
    },
    onSuccess: () => {
      qClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/users`] });
      qClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/users/stats`] });
      qClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/users/search`] });
      toast({
        title: "Сохранено",
        description: "Данные пользователя обновлены",
      });
    },
    onError: (error: any) => {
      console.error('Ошибка обновления пользователя:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить данные",
        variant: "destructive",
      });
    }
  });
}

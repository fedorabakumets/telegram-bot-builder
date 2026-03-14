/**
 * @fileoverview Мутация переключения базы данных
 * @description Хук для включения/выключения базы данных пользователей проекта
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@lib/queryClient';

/**
 * Параметры хука useToggleDatabase
 */
interface UseToggleDatabaseParams {
  /** Идентификатор проекта */
  projectId: number;
}

/**
 * Хук для переключения базы данных
 * @param params - Параметры хука
 * @returns Мутация переключения базы данных
 */
export function useToggleDatabase(params: UseToggleDatabaseParams) {
  const { projectId } = params;
  const { toast } = useToast();
  const qClient = useQueryClient();

  return useMutation({
    mutationFn: (enabled: boolean) =>
      apiRequest('PUT', `/api/projects/${projectId}`, { userDatabaseEnabled: enabled ? 1 : 0 }),
    onSuccess: (_data, enabled) => {
      qClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      toast({
        title: enabled ? 'База данных включена' : 'База данных выключена',
        description: enabled
          ? 'Функции работы с базой данных пользователей будут генерироваться в коде бота.'
          : 'Функции работы с базой данных НЕ будут генерироваться в коде бота.',
      });
    },
    onError: () => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось изменить настройку базы данных',
        variant: 'destructive',
      });
    },
  });
}

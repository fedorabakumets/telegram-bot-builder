/**
 * @fileoverview Мутации для управления базой данных пользователей
 * @description Содержит мутации для удаления, обновления и отправки сообщений пользователям
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { UserBotData } from '@shared/schema';

/**
 * Параметры для мутаций пользователей
 */
interface UseUserMutationsParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Функция обновления списка пользователей */
  refetchUsers: () => void;
  /** Функция обновления статистики */
  refetchStats: () => void;
}

/**
 * Возвращаемые значения мутаций
 */
interface UseUserMutationsReturn {
  deleteUserMutation: ReturnType<typeof useMutation>;
  updateUserMutation: ReturnType<typeof useMutation>;
  deleteAllUsersMutation: ReturnType<typeof useMutation>;
  toggleDatabaseMutation: ReturnType<typeof useMutation>;
  sendMessageMutation: ReturnType<typeof useMutation>;
}

/**
 * Хук для мутаций управления пользователями
 * @param params - Параметры хука
 * @returns Объект с мутациями
 */
export function useUserMutations(params: UseUserMutationsParams): UseUserMutationsReturn {
  const { projectId, refetchUsers, refetchStats } = params;
  const { toast } = useToast();
  const qClient = useQueryClient();

  /**
   * Мутация удаления пользователя
   */
  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => {
      console.log(`Attempting to delete user with ID: ${userId}`);
      return apiRequest('DELETE', `/api/users/${userId}`);
    },
    onSuccess: (data) => {
      console.log("User deletion successful:", data);
      qClient.removeQueries({ queryKey: [`/api/projects/${projectId}/users`] });
      qClient.removeQueries({ queryKey: [`/api/projects/${projectId}/users/stats`] });

      setTimeout(() => {
        refetchUsers();
        refetchStats();
      }, 100);

      toast({
        title: "Пользователь удален",
        description: "Данные пользователя успешно удалены",
      });
    },
    onError: (error) => {
      console.error("User deletion failed:", error);
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить пользователя. Проверьте консоль для подробностей.",
        variant: "destructive",
      });
    },
  });

  /**
   * Мутация обновления данных пользователя
   */
  const updateUserMutation = useMutation({
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
        title: "Статус изменен",
        description: "Статус пользователя успешно обновлен",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус пользователя",
        variant: "destructive",
      });
    },
  });

  /**
   * Мутация удаления всех пользователей
   */
  const deleteAllUsersMutation = useMutation({
    mutationFn: () => {
      console.log(`Attempting to delete all users for project: ${projectId}`);
      return apiRequest('DELETE', `/api/projects/${projectId}/users`);
    },
    onSuccess: (data) => {
      console.log("Bulk deletion successful:", data);
      qClient.removeQueries({ queryKey: [`/api/projects/${projectId}/users`] });
      qClient.removeQueries({ queryKey: [`/api/projects/${projectId}/users/stats`] });

      setTimeout(() => {
        refetchUsers();
        refetchStats();
      }, 100);

      const deletedCount = data?.deletedCount || 0;
      toast({
        title: "База данных очищена",
        description: `Удалено записей: ${deletedCount}. Все пользовательские данные удалены.`,
      });
    },
    onError: (error) => {
      console.error("Bulk deletion failed:", error);
      toast({
        title: "Ошибка очистки базы",
        description: "Не удалось очистить базу данных. Проверьте консоль для подробностей.",
        variant: "destructive",
      });
    },
  });

  /**
   * Мутация переключения базы данных
   */
  const toggleDatabaseMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      apiRequest('PUT', `/api/projects/${projectId}`, { userDatabaseEnabled: enabled ? 1 : 0 }),
    onSuccess: (_data, enabled) => {
      qClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      toast({
        title: enabled ? "База данных включена" : "База данных выключена",
        description: enabled
          ? "Функции работы с базой данных пользователей будут генерироваться в коде бота."
          : "Функции работы с базой данных НЕ будут генерироваться в коде бота.",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить настройку базы данных",
        variant: "destructive",
      });
    },
  });

  /**
   * Мутация отправки сообщения пользователю
   */
  const sendMessageMutation = useMutation({
    mutationFn: ({ messageText, userId }: { messageText: string; userId: string }) => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      return apiRequest('POST', `/api/projects/${projectId}/users/${userId}/send-message`, { messageText });
    },
    onSuccess: () => {
      qClient.invalidateQueries({
        queryKey: [`/api/projects/${projectId}/users/messages`],
      });
      toast({
        title: "Сообщение отправлено",
        description: "Сообщение успешно отправлено пользователю",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка отправки",
        description: error?.message || "Не удалось отправить сообщение",
        variant: "destructive",
      });
    },
  });

  return {
    deleteUserMutation,
    updateUserMutation,
    deleteAllUsersMutation,
    toggleDatabaseMutation,
    sendMessageMutation,
  };
}

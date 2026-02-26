/**
 * @fileoverview Главный хук для мутаций пользователей
 * @description Агрегирует все мутации для управления пользователями в одном хуке
 */

import { UseUserMutationsParams, UseUserMutationsReturn } from './types';
import { useDeleteUser } from './mutations/use-delete-user';
import { useUpdateUser } from './mutations/use-update-user';
import { useDeleteAllUsers } from './mutations/use-delete-all-users';
import { useToggleDatabase } from './mutations/use-toggle-database';
import { useSendMessage } from './mutations/use-send-message';

/**
 * Хук для мутаций управления пользователями
 * @param params - Параметры хука
 * @returns Объект с мутациями
 */
export function useUserMutations(params: UseUserMutationsParams): UseUserMutationsReturn {
  const { projectId, refetchUsers, refetchStats } = params;

  const deleteUserMutation = useDeleteUser({ projectId, refetchUsers, refetchStats });
  const updateUserMutation = useUpdateUser({ projectId, refetchUsers, refetchStats });
  const deleteAllUsersMutation = useDeleteAllUsers({ projectId, refetchUsers, refetchStats });
  const toggleDatabaseMutation = useToggleDatabase({ projectId });
  const sendMessageMutation = useSendMessage({ projectId });

  return {
    deleteUserMutation,
    updateUserMutation,
    deleteAllUsersMutation,
    toggleDatabaseMutation,
    sendMessageMutation,
  };
}

/**
 * @fileoverview Главный хук для мутаций пользователей
 * @description Агрегирует все мутации для управления пользователями в одном хуке
 */

import { UseUserMutationsParams, UseUserMutationsReturn } from './types';
import { useDeleteUser } from './mutations/use-delete-user';
import { useUpdateUser } from './mutations/use-update-user';
import { useDeleteAllUsers } from './mutations/use-delete-all-users';
import { useToggleDatabase } from './mutations/use-toggle-database';

/**
 * Хук для мутаций управления пользователями
 * @param params - Параметры хука
 * @returns Объект с мутациями
 */
export function useUserMutations(params: UseUserMutationsParams): UseUserMutationsReturn {
  const { projectId, selectedTokenId, refetchUsers, refetchStats } = params;

  const deleteUserMutation = useDeleteUser({
    projectId,
    selectedTokenId,
    refetchUsers,
    refetchStats,
  });
  const updateUserMutation = useUpdateUser({
    projectId,
    selectedTokenId,
    refetchUsers,
    refetchStats,
  });
  const deleteAllUsersMutation = useDeleteAllUsers({
    projectId,
    selectedTokenId,
    refetchUsers,
    refetchStats,
  });
  const toggleDatabaseMutation = useToggleDatabase({ projectId });

  return {
    deleteUserMutation,
    updateUserMutation,
    deleteAllUsersMutation,
    toggleDatabaseMutation,
  };
}

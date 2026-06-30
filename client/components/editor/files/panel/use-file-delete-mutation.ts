/**
 * @fileoverview Хук мутации массового удаления файлов проекта.
 * Вынесен из оркестратора FileStoragePanel, чтобы тело панели и хук
 * состояния оставались в пределах лимита строк. Используется
 * SelectionActionBar (Req 3.5, 3.6).
 * @module components/editor/files/panel/use-file-delete-mutation
 */

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/** Результат хука удаления файлов */
export interface UseFileDeleteMutationResult {
  /** Удалить файлы по списку id (источник нужен для серверного резолва) */
  deleteFiles: (ids: number[], category: string) => void;
  /** Идёт ли удаление */
  isDeleting: boolean;
}

/**
 * Хук массового удаления файлов проекта с инвалидацией кэша списка.
 * @param projectId - Идентификатор проекта
 * @param onDeleted - Колбэк после успешного удаления (например, сброс выбора)
 * @returns Функция удаления и флаг процесса
 */
export function useFileDeleteMutation(projectId: number, onDeleted?: () => void): UseFileDeleteMutationResult {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (payload: { ids: number[]; category: string }) => {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Ошибка удаления файлов');
      return res.json();
    },
    onSuccess: () => {
      onDeleted?.();
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'files'] });
    },
  });

  const deleteFiles = useCallback(
    (ids: number[], category: string) => {
      if (ids.length === 0) return;
      mutation.mutate({ ids, category });
    },
    [mutation],
  );

  return { deleteFiles, isDeleting: mutation.isPending };
}

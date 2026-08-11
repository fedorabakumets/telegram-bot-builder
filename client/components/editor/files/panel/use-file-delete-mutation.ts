/**
 * @fileoverview Хук мутации массового удаления файлов проекта
 * @module components/editor/files/panel/use-file-delete-mutation
 */

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { FileSource } from '../hooks/use-project-files';

/** Элемент удаления с источником записи */
export interface FileDeleteItem {
  /** ID media_files или bot_messages */
  id: number;
  /** Источник: incoming | outgoing | uploaded */
  source: FileSource;
}

/** Результат хука удаления файлов */
export interface UseFileDeleteMutationResult {
  /** Удалить файлы (с source на каждый id — нужно для вкладки «all») */
  deleteFiles: (items: FileDeleteItem[]) => void;
  /** Идёт ли удаление */
  isDeleting: boolean;
}

/**
 * Массовое удаление файлов проекта с инвалидацией кэша списка.
 * @param projectId - ID проекта
 * @param onDeleted - Колбэк после успеха
 * @returns Функция удаления и флаг процесса
 */
export function useFileDeleteMutation(
  projectId: number,
  onDeleted?: () => void,
): UseFileDeleteMutationResult {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (items: FileDeleteItem[]) => {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Ошибка удаления файлов');
      return res.json();
    },
    onSuccess: () => {
      onDeleted?.();
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'storage-quota'] });
    },
  });

  const deleteFiles = useCallback(
    (items: FileDeleteItem[]) => {
      if (items.length === 0) return;
      mutation.mutate(items);
    },
    [mutation],
  );

  return { deleteFiles, isDeleting: mutation.isPending };
}

/** @fileoverview Чтение, редактирование и синхронизация списка администраторов проекта. */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';

/** Ответ проектного маршрута администраторов. */
interface AdminIdsResponse {
  /** Telegram ID через запятую. */
  adminIds: string;
}

/** Локальные изменения списка. */
interface AdminIdsDraft {
  /** Проект, для которого сделаны изменения. */
  projectId: number;
  /** Редактируемые строки. */
  ids: string[];
}

/**
 * Разбивает список на отдельные непустые значения и исключает дубликаты.
 * @param raw - Строка с ID через запятую.
 * @returns Сохранённые ID.
 */
function parseIds(raw: string): string[] {
  return [...new Set(raw.split(',').map((value) => value.trim()).filter(Boolean))];
}

/**
 * Проверяет Telegram ID перед прямым сохранением или добавлением в черновик.
 * @param values - Строки формы.
 * @returns Строка без дубликатов или null при ошибке формата.
 */
function serializeIds(values: string[]): string | null {
  const ids = parseIds(values.join(','));
  if (ids.some((id) => !/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1)) return null;
  return [...new Set(ids.map((id) => String(Number(id))))].join(',');
}

/**
 * Загружает общий список проекта, сохраняя локальные правки при обновлении кэша.
 * @param projectId - Идентификатор проекта.
 * @param canManage - Может ли пользователь редактировать общий список.
 * @returns Значения, состояние загрузки и действия формы.
 */
export function useAdminIds(projectId: number, canManage: boolean) {
  const queryClient = useQueryClient();
  const url = `/api/projects/${projectId}/admin-ids`;
  const query = useQuery<AdminIdsResponse>({
    queryKey: [url], queryFn: () => apiRequest('GET', url), retry: false,
  });
  const [draft, setDraft] = useState<AdminIdsDraft | null>(null);
  const [invalid, setInvalid] = useState(false);
  const savedIds = parseIds(query.data?.adminIds ?? '');
  const hasDraft = canManage && draft?.projectId === projectId;
  const ids = hasDraft ? draft.ids : savedIds.length > 0 ? savedIds : [''];
  const mutation = useMutation<AdminIdsResponse, Error, string>({
    mutationFn: (adminIds) => apiRequest('PUT', url, { adminIds }),
    onSuccess: async ({ adminIds }) => {
      await queryClient.cancelQueries({ queryKey: [url], exact: true });
      queryClient.setQueryData<AdminIdsResponse>([url], { adminIds });
      setDraft((current) => current?.projectId === projectId ? null : current);
      void queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      void queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
    },
  });

  /**
   * Записывает значения формы, не меняя общий список до сохранения.
   * @param values - Новый список строк.
   */
  function setIds(values: string[]): void {
    if (!canManage || !query.data || mutation.isPending) return;
    mutation.reset();
    setInvalid(false);
    setDraft({ projectId, ids: values });
  }

  /**
   * Сохраняет проверенный список напрямую либо добавляет его в общий черновик бота.
   * @param onPendingChange - Добавление в общий черновик, если он используется.
   */
  function save(onPendingChange?: (key: string, value: string) => void): void {
    if (!canManage || !query.data || !hasDraft || mutation.isPending) return;
    const adminIds = serializeIds(ids);
    if (adminIds === null) {
      setInvalid(true);
      return;
    }
    if (onPendingChange) onPendingChange('ADMIN_IDS', adminIds);
    else mutation.mutate(adminIds);
  }

  return {
    ids, setIds, save, hasDraft, isLoading: query.isPending, isReady: !!query.data,
    isSaving: mutation.isPending, isSaved: mutation.isSuccess,
    loadError: query.isError, retry: query.refetch,
    saveError: invalid ? 'Введите действительные числовые Telegram ID.' : mutation.error?.message,
  };
}

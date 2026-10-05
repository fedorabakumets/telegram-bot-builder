/**
 * @fileoverview Загрузка и сохранение раздела настроек рантайма
 * @module components/admin/runtime/use-runtime-settings
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import type { RuntimeGroupView } from './runtime-types';

/**
 * Ключ кэша раздела
 * @param group - Ключ раздела
 * @returns Ключ react-query
 */
export function runtimeSettingsKey(group: string): [string, string] {
  return ['/admin/api/runtime-settings', group];
}

/**
 * Загружает метаданные и текущие значения раздела
 * @param group - Ключ раздела
 * @returns Запрос раздела
 */
export function useRuntimeSettings(group: string) {
  return useQuery<RuntimeGroupView>({
    queryKey: runtimeSettingsKey(group),
    queryFn: () => apiRequest('GET', `/admin/api/runtime-settings/${group}`),
    enabled: Boolean(group),
  });
}

/**
 * Сохраняет значения. Пустые секреты в тело не входят.
 * @param group - Ключ раздела
 * @returns Мутация сохранения
 */
export function useSaveRuntimeSettings(group: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: Record<string, string>) =>
      apiRequest('PUT', `/admin/api/runtime-settings/${group}`, { values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: runtimeSettingsKey(group) });
    },
  });
}

/**
 * Снимает бэкап сразу, не дожидаясь интервала
 * @returns Мутация запуска
 */
export function useRunRuntimeBackup() {
  return useMutation({
    mutationFn: () => apiRequest('POST', '/admin/api/runtime-settings/backups/run'),
  });
}

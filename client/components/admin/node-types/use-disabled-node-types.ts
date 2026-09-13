/**
 * @fileoverview Загрузка и сохранение выключенных типов блоков
 * @module components/admin/hooks/use-disabled-node-types
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';

/** Ответ API панели по выключенным типам */
export interface AdminDisabledNodeTypesResponse {
  /** Выключенные типы */
  disabled: string[];
  /** Ядро, которое нельзя выключить */
  core: string[];
  /** Полный список палитры (опционально) */
  palette?: string[];
}

/**
 * Загружает список выключенных типов из панели управления
 * @returns Запрос списка
 */
export function useAdminDisabledNodeTypes() {
  return useQuery<AdminDisabledNodeTypesResponse>({
    queryKey: ['/admin/api/disabled-node-types'],
    queryFn: () => apiRequest('GET', '/admin/api/disabled-node-types'),
  });
}

/**
 * Сохраняет список выключенных типов
 * @returns Мутация сохранения
 */
export function useSaveAdminDisabledNodeTypes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (disabled: string[]) =>
      apiRequest('PUT', '/admin/api/disabled-node-types', { disabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/admin/api/disabled-node-types'] });
    },
  });
}

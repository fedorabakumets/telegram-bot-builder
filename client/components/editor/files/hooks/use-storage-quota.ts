/**
 * @fileoverview React Query хук для получения квоты хранилища проекта.
 * Запрашивает GET /api/projects/:projectId/storage-quota и отдаёт занятое
 * место, лимит (null = безлимит) и флаг мягкого превышения для индикатора
 * StorageQuotaBar (Req 4.1). Повторяет паттерн use-project-files.
 * @module components/editor/files/hooks/use-storage-quota
 */

import { useQuery } from '@tanstack/react-query';

/** Ответ API с квотой хранилища проекта */
interface StorageQuotaResponse {
  /** Занято байт (сумма по локальным бэкендам проекта) */
  usedBytes: number;
  /** Лимит в байтах либо null для безлимитного режима */
  limitBytes: number | null;
  /** Превышена ли мягкая квота (false при безлимите) */
  quotaExceeded: boolean;
}

/** Результат хука квоты хранилища */
export interface UseStorageQuotaResult {
  /** Занято байт */
  usedBytes: number;
  /** Лимит в байтах либо null для безлимитного режима */
  limitBytes: number | null;
  /** Превышена ли мягкая квота */
  quotaExceeded: boolean;
  /** Идёт ли загрузка данных квоты */
  isLoading: boolean;
}

/**
 * Хук для получения квоты хранилища проекта.
 * @param projectId - Идентификатор проекта
 * @returns Занятое место, лимит, флаг превышения и состояние загрузки
 */
export function useStorageQuota(projectId: number): UseStorageQuotaResult {
  const { data, isLoading } = useQuery<StorageQuotaResponse>({
    queryKey: ['/api/projects', projectId, 'storage-quota'],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/storage-quota`);
      if (!res.ok) throw new Error('Ошибка загрузки квоты хранилища');
      return res.json();
    },
    enabled: !!projectId,
    staleTime: 15000,
  });

  return {
    usedBytes: data?.usedBytes ?? 0,
    limitBytes: data?.limitBytes ?? null,
    quotaExceeded: data?.quotaExceeded ?? false,
    isLoading,
  };
}

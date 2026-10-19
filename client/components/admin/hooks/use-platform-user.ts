/**
 * @fileoverview Хук загрузки карточки аккаунта платформы
 * @module components/admin/hooks/use-platform-user
 */

import { useQuery } from '@tanstack/react-query';
import type { PlatformUserDetailResponse } from '@shared/admin/platform-users.types';
import { apiRequest } from '@/queryClient';

/**
 * Загружает карточку аккаунта по опознавателю
 * @param userId - Опознаватель Telegram
 * @returns Запрос карточки
 */
export function usePlatformUser(userId: number | null) {
  return useQuery<PlatformUserDetailResponse>({
    queryKey: ['/admin/api/users', userId],
    queryFn: () => apiRequest('GET', `/admin/api/users/${userId}`),
    enabled: userId != null && userId > 0,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });
}

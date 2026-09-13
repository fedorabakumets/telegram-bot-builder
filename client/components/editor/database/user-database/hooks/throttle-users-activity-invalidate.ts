/**
 * @fileoverview Ограничение частоты сброса кэша users-activity (не чаще 5 с)
 * @module client/components/editor/database/user-database/hooks/throttle-users-activity-invalidate
 */

import type { QueryClient } from '@tanstack/react-query';

/** Минимальный интервал между сбросами кэша, мс */
const THROTTLE_MS = 5_000;

/**
 * Создаёт функцию сброса кэша users-activity с ограничением частоты
 * @param queryClient - Клиент React Query
 * @param projectId - Идентификатор проекта
 * @returns Функция сброса и очистка таймера
 */
export function createUsersActivityInvalidator(
  queryClient: QueryClient,
  projectId: number,
): { invalidate: () => void; dispose: () => void } {
  let lastAt = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const run = () => {
    lastAt = Date.now();
    queryClient.invalidateQueries({
      predicate: (query) =>
        query.queryKey[0] === 'users-activity' && query.queryKey[1] === projectId,
    });
  };

  const invalidate = () => {
    const elapsed = Date.now() - lastAt;
    if (elapsed >= THROTTLE_MS) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      run();
      return;
    }
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      run();
    }, THROTTLE_MS - elapsed);
  };

  const dispose = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return { invalidate, dispose };
}

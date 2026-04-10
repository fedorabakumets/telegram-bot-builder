/**
 * @fileoverview Утилита инвалидации кеша авторизации
 * @module utils/invalidate-auth-queries
 */

import type { QueryClient } from '@tanstack/react-query';

/**
 * Инвалидирует все запросы, зависящие от состояния авторизации пользователя.
 * Вызывается при входе, выходе и смене пользователя.
 *
 * @param queryClient - Экземпляр QueryClient из react-query
 */
export function invalidateAuthQueries(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: ['/api/templates/category/custom'] });
  queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
  queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
}

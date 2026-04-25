/**
 * @fileoverview Утилита инвалидации и очистки кеша авторизации
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

/**
 * Полностью очищает кеш данных пользователя при выходе или смене аккаунта.
 * Удаляет все закешированные проекты, шаблоны и токены чтобы
 * следующий пользователь не видел данные предыдущего.
 *
 * @param queryClient - Экземпляр QueryClient из react-query
 */
export function clearUserCache(queryClient: QueryClient): void {
  queryClient.removeQueries({ queryKey: ['/api/projects'] });
  queryClient.removeQueries({ queryKey: ['/api/projects/list'] });
  queryClient.removeQueries({ queryKey: ['/api/templates'] });
  queryClient.removeQueries({ queryKey: ['/api/templates/category/custom'] });
  queryClient.removeQueries({ queryKey: ['/api/tokens'] });
}

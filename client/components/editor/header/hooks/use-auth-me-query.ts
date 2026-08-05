/**
 * @fileoverview React Query для GET /api/auth/me (дедупликация между подписчиками)
 * @module components/editor/header/hooks/use-auth-me-query
 */

import { useQuery } from '@tanstack/react-query';
import type { TelegramUser } from '@/types/telegram-user';
import { normalizeTelegramUser } from '@/utils/normalize-telegram-user';

/** Ключ кэша текущего пользователя Studio */
export const AUTH_ME_QUERY_KEY = ['/api/auth/me'] as const;

/**
 * Загружает текущего пользователя с сервера
 * @returns Пользователь Telegram или null
 */
export async function fetchAuthMe(): Promise<TelegramUser | null> {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  const data = await res.json();
  return normalizeTelegramUser(data.user);
}

/**
 * Хук запроса /api/auth/me с дедупликацией через React Query
 * @returns Результат useQuery с TelegramUser | null
 */
export function useAuthMeQuery() {
  return useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: fetchAuthMe,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  });
}

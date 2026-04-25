/**
 * @fileoverview Хук логики экрана авторизации
 * @module components/editor/auth/hooks/use-auth-screen
 */

import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import { useTelegramLogin } from '@/components/editor/header/hooks/use-telegram-login';
import { useMiniAppAuth } from '@/components/editor/header/hooks/use-mini-app-auth';
import { isTelegramUser } from '@/types/telegram-user';

/**
 * Результат хука экрана авторизации
 */
export interface UseAuthScreenResult {
  /** Авторизован ли пользователь через Telegram */
  isAuthenticated: boolean;
  /** Идёт ли загрузка состояния авторизации */
  isLoading: boolean;
  /** Открывает диалог входа через Telegram */
  handleTelegramLogin: () => void;
}

/**
 * Хук логики экрана авторизации.
 * Объединяет состояние авторизации и обработчик входа.
 * Монтирует useMiniAppAuth для автоматической авторизации в Telegram Mini App.
 *
 * @returns Объект с флагами авторизации и обработчиком входа
 */
export function useAuthScreen(): UseAuthScreenResult {
  // Автоматическая авторизация через Telegram Mini App
  useMiniAppAuth();

  const { user, isLoading } = useTelegramAuth();
  const { handleTelegramLogin } = useTelegramLogin();

  const isAuthenticated = user !== null && isTelegramUser(user);

  return { isAuthenticated, isLoading, handleTelegramLogin };
}

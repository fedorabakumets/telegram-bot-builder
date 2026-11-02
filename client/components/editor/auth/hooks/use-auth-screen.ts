/**
 * @fileoverview Хук логики экрана авторизации
 * @module components/editor/auth/hooks/use-auth-screen
 */

import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import { useTelegramLogin } from '@/components/editor/header/hooks/use-telegram-login';
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
 * Автоматический вход Mini App выполняет общий защитный компонент.
 *
 * @returns Объект с флагами авторизации и обработчиком входа
 */
export function useAuthScreen(): UseAuthScreenResult {
  const { user, isLoading } = useTelegramAuth();
  const { handleTelegramLogin } = useTelegramLogin();

  const isAuthenticated = user !== null && isTelegramUser(user);

  return { isAuthenticated, isLoading, handleTelegramLogin };
}

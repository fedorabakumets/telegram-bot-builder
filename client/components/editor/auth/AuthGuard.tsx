/**
 * @fileoverview Компонент-охранник авторизации — скрывает контент от неавторизованных пользователей
 * @module components/editor/auth/AuthGuard
 */

import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import { useMiniAppAuth } from '@/components/editor/header/hooks/use-mini-app-auth';
import { AuthScreen } from './AuthScreen';

/**
 * Свойства компонента AuthGuard
 */
interface AuthGuardProps {
  /** Дочерние элементы, доступные только авторизованным пользователям */
  children: ReactNode;
}

/**
 * Компонент-охранник авторизации.
 * - Монтирует useMiniAppAuth для автоматической авторизации в Telegram Mini App.
 * - Пока идёт загрузка — показывает спиннер.
 * - Если пользователь гость — показывает экран авторизации.
 * - Иначе — рендерит дочерние элементы.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент: спиннер, экран авторизации или дочерние элементы
 */
export function AuthGuard({ children }: AuthGuardProps) {
  // Автоматическая авторизация через Telegram Mini App
  useMiniAppAuth();

  const { user, isLoading, isGuest } = useTelegramAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || isGuest(user)) {
    return <AuthScreen />;
  }

  return <>{children}</>;
}

/**
 * @fileoverview Компонент-охранник настройки — блокирует доступ до завершения setup
 * @module components/editor/setup/SetupGuard
 */

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthGuard } from '@/components/editor/auth';
import { useSetupBootstrap } from './hooks/use-setup';
import { SetupBlockedScreen } from './SetupBlockedScreen';

/**
 * Свойства компонента SetupGuard
 */
interface SetupGuardProps {
  /** Дочерние элементы, доступные только после завершения настройки */
  children: ReactNode;
}

/**
 * Компонент-охранник первоначальной настройки.
 * - Пока идёт загрузка — спиннер.
 * - Если не настроено и admin доступен — редирект на /admin/login?setup=1.
 * - Если не настроено и admin недоступен — SetupBlockedScreen.
 * - Если настроено — AuthGuard → контент.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function SetupGuard({ children }: SetupGuardProps) {
  const { data, isLoading } = useSetupBootstrap();

  useEffect(() => {
    if (!isLoading && data && !data.configured && data.adminEnabled) {
      window.location.replace('/admin/login?setup=1');
    }
  }, [data, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data?.configured) {
    if (data?.adminEnabled) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    return <SetupBlockedScreen />;
  }

  return <AuthGuard>{children}</AuthGuard>;
}

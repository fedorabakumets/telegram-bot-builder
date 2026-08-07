/**
 * @fileoverview Компонент-охранник настройки — блокирует доступ до завершения первоначальной настройки
 * @module components/editor/setup/SetupGuard
 */

import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { AuthGuard } from '@/components/editor/auth';
import { useSetupStatus } from './hooks/use-setup';
import { SetupPage } from './SetupPage';

/**
 * Свойства компонента SetupGuard
 */
interface SetupGuardProps {
  /** Дочерние элементы, доступные только после завершения настройки */
  children: ReactNode;
}

/**
 * Компонент-охранник первоначальной настройки.
 * - Пока идёт загрузка статуса — показывает спиннер.
 * - Если настройка не завершена — показывает SetupPage.
 * - Если настройка завершена — оборачивает children в AuthGuard.
 *
 * Порядок проверок: SetupGuard → AuthGuard → контент.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент: спиннер, страница настройки или защищённый контент
 */
export function SetupGuard({ children }: SetupGuardProps) {
  const { data, isLoading } = useSetupStatus();
  const [location, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data?.configured) {
    if (location !== '/setup') {
      navigate('/setup', { replace: true });
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    return <SetupPage />;
  }

  return <AuthGuard>{children}</AuthGuard>;
}

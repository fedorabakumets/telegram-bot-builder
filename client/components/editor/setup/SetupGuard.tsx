/**
 * @fileoverview Компонент-охранник настройки — блокирует доступ до завершения setup
 * @module components/editor/setup/SetupGuard
 */

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthGuard } from '@/components/editor/auth';
import { Button } from '@/components/ui/button';
import { useSetupBootstrap } from './hooks/use-setup';
import { SetupBlockedScreen } from './SetupBlockedScreen';
import { ADMIN_SETUP_URL, openAdminSetup } from './setup-admin-navigation';

/**
 * Свойства компонента SetupGuard
 */
interface SetupGuardProps {
  /** Дочерние элементы, доступные только после завершения настройки */
  children: ReactNode;
}

/**
 * Открывает редактор после подтверждения настройки и позволяет повторить неудачную проверку.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function SetupGuard({ children }: SetupGuardProps) {
  const { data, isError, isFetching, fetchStatus, refetch } = useSetupBootstrap();
  const [retryRequested, setRetryRequested] = useState(false);
  const isPaused = fetchStatus === 'paused';
  const checking = isFetching || isPaused;
  const needsSetup = data?.configured === false && !isError && !checking;
  const shouldOpenAdmin = needsSetup && data?.adminEnabled === true;

  useEffect(() => {
    if (shouldOpenAdmin) openAdminSetup();
  }, [shouldOpenAdmin]);

  if (data?.configured === true) return <AuthGuard>{children}</AuthGuard>;
  if (shouldOpenAdmin) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <p role="status" className="text-sm text-muted-foreground">Открываем панель настройки…</p>
        <Button variant="outline" asChild><a href={ADMIN_SETUP_URL}>Открыть панель настройки</a></Button>
      </main>
    );
  }
  if (needsSetup) return <SetupBlockedScreen />;

  if (isFetching && !isError && !retryRequested) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 motion-safe:animate-spin text-primary" aria-hidden="true" />
          Проверяем состояние платформы…
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md space-y-4 text-center">
        {!checking && (
          <div role="alert" className="space-y-2">
            <h1 className="text-xl font-semibold">Не удалось проверить состояние платформы</h1>
            <p className="text-sm text-muted-foreground">Проверьте подключение и повторите попытку.</p>
          </div>
        )}
        <p role="status" className="text-sm text-muted-foreground">
          {isPaused ? 'Проверка продолжится автоматически, когда вкладка снова станет активной.'
            : isFetching ? 'Проверяем состояние платформы…' : ''}
        </p>
        <Button type="button" variant="outline" aria-disabled={checking} className="aria-disabled:opacity-50"
          onClick={() => {
            if (checking) return;
            setRetryRequested(true);
            void refetch({ cancelRefetch: false });
          }}>
          Повторить проверку
        </Button>
      </div>
    </main>
  );
}

/**
 * @fileoverview Экран авторизации — отображается неавторизованным пользователям
 * @module components/editor/auth/AuthScreen
 */

import { useCallback, useState } from 'react';
import { Bot } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AuthTelegramButton } from './AuthTelegramButton';
import { AuthDevForm } from './AuthDevForm';
import { TypewriterText } from './TypewriterText';
import { useAuthScreen } from './hooks/use-auth-screen';
import { useAppConfig } from '@/hooks/use-app-config';
import { cn } from '@/utils/utils';

/** Приветственная реплика под заголовком */
const WELCOME_LINE = 'Войдите через Telegram чтобы начать';

/**
 * Экран авторизации приложения.
 * В dev-режиме (skipAuth по умолчанию) показывает инлайн-форму ввода Telegram ID.
 * При SKIP_AUTH=false в .env — кнопку входа через Telegram Login Widget.
 *
 * @returns JSX элемент экрана авторизации
 */
export function AuthScreen() {
  const { handleTelegramLogin, isLoading } = useAuthScreen();
  const { data: appConfig } = useAppConfig();
  const [introDone, setIntroDone] = useState(false);

  /** true если сервер в режиме dev-login (skipAuth, по умолчанию включён) */
  const isDev = appConfig?.skipAuth ?? true;

  const handleIntroDone = useCallback(() => setIntroDone(true), []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm mx-4 shadow-2xl border-border/50">
        <CardHeader className="items-center text-center space-y-3 pb-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 animate-in fade-in zoom-in-95 duration-500">
            <Bot className="h-8 w-8 text-primary" />
          </div>

          <div className="space-y-1 min-h-[4.5rem]">
            <CardTitle className="text-2xl font-bold animate-in fade-in duration-500">
              BotCraft Studio
            </CardTitle>
            <CardDescription className="text-sm min-h-[1.25rem]">
              <TypewriterText
                text={WELCOME_LINE}
                delayMs={450}
                speedMs={36}
                onDone={handleIntroDone}
              />
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent
          className={cn(
            'pt-2 transition-all duration-500',
            introDone
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2 pointer-events-none',
          )}
        >
          {isDev ? (
            <AuthDevForm />
          ) : (
            <AuthTelegramButton onClick={handleTelegramLogin} isLoading={isLoading} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

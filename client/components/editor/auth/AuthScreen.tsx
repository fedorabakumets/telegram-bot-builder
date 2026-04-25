/**
 * @fileoverview Экран авторизации — отображается неавторизованным пользователям
 * @module components/editor/auth/AuthScreen
 */

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
import { useAuthScreen } from './hooks/use-auth-screen';

/** true если приложение запущено в dev-режиме */
const isDev = import.meta.env.MODE === 'development';

/**
 * Экран авторизации приложения.
 * В dev-режиме показывает инлайн-форму ввода Telegram ID.
 * В prod-режиме показывает кнопку входа через Telegram.
 *
 * @returns JSX элемент экрана авторизации
 */
export function AuthScreen() {
  const { handleTelegramLogin, isLoading } = useAuthScreen();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm mx-4 shadow-2xl border-border/50">
        <CardHeader className="items-center text-center space-y-3 pb-4">
          {/* Иконка приложения */}
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20">
            <Bot className="h-8 w-8 text-primary" />
          </div>

          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold">BotCraft Studio</CardTitle>
            <CardDescription className="text-sm">
              Войдите через Telegram чтобы начать
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
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

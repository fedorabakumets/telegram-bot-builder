/**
 * @fileoverview Страница первоначальной настройки приложения
 * @module components/editor/setup/SetupPage
 */

import { Bot } from 'lucide-react';
import { useLocation } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SetupForm } from './SetupForm';
import { SetupInstructions } from './SetupInstructions';

/**
 * Страница первоначальной настройки BotCraft Studio.
 * На desktop отображает форму и инструкцию в двух колонках,
 * на мобильных — форму сверху, инструкцию снизу.
 * После успешного сохранения перенаправляет на /projects.
 *
 * @returns JSX элемент страницы настройки
 */
export function SetupPage() {
  const [, navigate] = useLocation();

  /** Обрабатывает успешное сохранение настроек */
  const handleSuccess = () => navigate('/projects');

  return (
    <div className="flex items-start justify-center min-h-screen bg-background px-4 py-10">
      <div className="w-full max-w-3xl space-y-6">
        {/* Заголовок страницы */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Первоначальная настройка</h1>
            <p className="text-sm text-muted-foreground">
              Укажи данные Telegram-бота для активации авторизации
            </p>
          </div>
        </div>

        {/* Основной контент: форма + инструкция */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Форма настройки */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Данные бота</CardTitle>
              <CardDescription className="text-xs">
                Заполни поля из настроек BotFather
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SetupForm onSuccess={handleSuccess} />
            </CardContent>
          </Card>

          {/* Инструкция */}
          <SetupInstructions />
        </div>
      </div>
    </div>
  );
}

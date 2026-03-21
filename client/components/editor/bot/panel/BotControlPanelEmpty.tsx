/**
 * @fileoverview Состояние отсутствия проектов
 *
 * Компонент отображается, когда нет доступных проектов.
 *
 * @module BotControlPanelEmpty
 */

import { Card, CardContent } from '@/components/ui/card';
import { Bot } from 'lucide-react';

/**
 * Состояние отсутствия проектов
 */
export function BotControlPanelEmpty() {
  return (
    <Card className="border-2 border-dashed border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 dark:from-slate-800/30 dark:to-slate-900/20">
      <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-6">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 dark:from-blue-500/30 dark:to-indigo-500/20 flex items-center justify-center mb-4 sm:mb-6">
          <Bot className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-2">Нет доступных проектов</h3>
        <p className="text-sm sm:text-base text-muted-foreground text-center mb-6 max-w-md">
          Создайте проект, чтобы начать добавление и управление Telegram-ботами
        </p>
      </CardContent>
    </Card>
  );
}

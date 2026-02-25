/**
 * @fileoverview Заголовок панели управления ботами
 *
 * Компонент отображает заголовок с иконкой и кнопку подключения бота.
 *
 * @module BotControlPanelHeader
 */

import { Button } from '@/components/ui/button';
import { Bot, Plus } from 'lucide-react';

interface BotControlPanelHeaderProps {
  onConnectBot: () => void;
}

/**
 * Заголовок панели управления ботами
 */
export function BotControlPanelHeader({ onConnectBot }: BotControlPanelHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/10 dark:from-blue-500/30 dark:to-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Боты
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground pl-10 sm:pl-12 -mt-1">
          Управление ботами из всех проектов
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          onClick={onConnectBot}
          className="flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 h-10 sm:h-auto px-3 sm:px-4 py-2 sm:py-2 text-sm sm:text-base"
          data-testid="button-connect-bot"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Подключить бот</span>
        </Button>
      </div>
    </div>
  );
}

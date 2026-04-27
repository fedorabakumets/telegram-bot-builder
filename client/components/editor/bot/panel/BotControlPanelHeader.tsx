/**
 * @fileoverview Заголовок панели управления ботами
 *
 * Компонент отображает заголовок с иконкой и кнопку подключения бота.
 * Заголовок использует text-foreground (светлый), кнопка — сдержанный outline-стиль.
 *
 * @module BotControlPanelHeader
 */

import { Button } from '@/components/ui/button';
import { Bot, Plus } from 'lucide-react';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import { isGuest } from '@/types/telegram-user';

/** Свойства заголовка панели управления ботами */
interface BotControlPanelHeaderProps {
  /** Обработчик нажатия кнопки подключения бота */
  onConnectBot: () => void;
}

/**
 * Заголовок панели управления ботами
 */
export function BotControlPanelHeader({ onConnectBot }: BotControlPanelHeaderProps) {
  const { user } = useTelegramAuth();
  const isGuestUser = !user || isGuest(user);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-600/15 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground leading-tight">
              Боты
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Управление ботами из всех проектов
            </p>
          </div>
        </div>
      </div>
      {!isGuestUser && (
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onConnectBot}
            className="flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto border-border hover:bg-accent h-9 px-3 sm:px-4 text-sm"
            data-testid="button-connect-bot"
          >
            <Plus className="w-4 h-4" />
            <span>Подключить бот</span>
          </Button>
        </div>
      )}
    </div>
  );
}

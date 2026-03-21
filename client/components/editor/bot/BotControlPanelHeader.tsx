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

/** Свойства заголовка панели управления ботами */
interface BotControlPanelHeaderProps {
  /** Обработчик нажатия кнопки подключения бота */
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
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
            Боты
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground pl-10 sm:pl-12 -mt-1">
          Управление ботами из всех проектов
        </p>
      </div>
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
    </div>
  );
}

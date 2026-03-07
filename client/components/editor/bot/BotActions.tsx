/**
 * @fileoverview Компонент кнопок действий бота
 *
 * Отображает кнопки управления ботом:
 * - Редактирование профиля
 * - Запуск/остановка бота
 * - Удаление бота (через меню)
 *
 * @module BotActions
 */

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Edit2, Play, Square, MoreHorizontal, Trash2 } from 'lucide-react';

interface BotActionsProps {
  isBotRunning: boolean;
  startBotMutation: any;
  stopBotMutation: any;
  deleteBotMutation: any;
  onEditProfile: () => void;
  isProfileLoading: boolean;
  tokenId: number;
  projectId: number;
}

/**
 * Кнопки действий бота
 */
export function BotActions({
  isBotRunning,
  startBotMutation,
  stopBotMutation,
  deleteBotMutation,
  onEditProfile,
  isProfileLoading,
  tokenId,
  projectId
}: BotActionsProps) {
  // Проверяем, выполняется ли операция для этого конкретного токена
  const isStartingThisBot = startBotMutation.variables?.tokenId === tokenId;
  const isStoppingThisBot = stopBotMutation.variables?.tokenId === tokenId;
  const isDeletingThisBot = deleteBotMutation.variables?.tokenId === tokenId;

  return (
    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={onEditProfile}
        disabled={isProfileLoading}
        title={isProfileLoading ? "Загрузка информации о боте..." : "Редактировать профиль бота"}
        data-testid="button-edit-bot-profile"
      >
        <Edit2 className="h-4 w-4" />
      </Button>

      {!isBotRunning ? (
        <Button
          size="sm"
          onClick={() => startBotMutation.mutate({ tokenId, projectId })}
          disabled={startBotMutation.isPending && isStartingThisBot}
          className="h-9 gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm bg-green-600 hover:bg-green-700"
        >
          <Play className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{startBotMutation.isPending && isStartingThisBot ? 'Запуск...' : 'Запустить'}</span>
          <span className="sm:hidden">{startBotMutation.isPending && isStartingThisBot ? '...' : 'Запуск'}</span>
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => stopBotMutation.mutate({ tokenId, projectId })}
          disabled={stopBotMutation.isPending && isStoppingThisBot}
          className="h-9 gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm"
        >
          <Square className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{stopBotMutation.isPending && isStoppingThisBot ? 'Остановка...' : 'Остановить'}</span>
          <span className="sm:hidden">{stopBotMutation.isPending && isStoppingThisBot ? '...' : 'Стоп'}</span>
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0" data-testid="button-bot-menu">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => deleteBotMutation.mutate(tokenId)}
            className="text-red-600 dark:text-red-400"
            disabled={deleteBotMutation.isPending && isDeletingThisBot}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

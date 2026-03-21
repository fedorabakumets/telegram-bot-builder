/**
 * @fileoverview Компонент кнопок действий бота
 *
 * Отображает кнопки управления ботом:
 * - Редактирование профиля
 * - Запуск/остановка бота (размер sm, h-8, text-xs)
 * - Удаление бота (через меню)
 *
 * @module BotActions
 */

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Edit2, Play, Square, MoreHorizontal, Trash2 } from 'lucide-react';

interface BotActionsProps {
  /** Запущен ли бот */
  isBotRunning: boolean;
  /** Мутация запуска бота */
  startBotMutation: {
    isPending: boolean;
    variables?: { tokenId: number; projectId: number };
    mutate: (vars: { tokenId: number; projectId: number }) => void;
  };
  /** Мутация остановки бота */
  stopBotMutation: {
    isPending: boolean;
    variables?: { tokenId: number; projectId: number };
    mutate: (vars: { tokenId: number; projectId: number }) => void;
  };
  /** Мутация удаления бота */
  deleteBotMutation: {
    isPending: boolean;
    variables?: number;
    mutate: (tokenId: number) => void;
  };
  /** Обработчик открытия редактора профиля */
  onEditProfile: () => void;
  /** Загружается ли профиль бота */
  isProfileLoading: boolean;
  /** ID токена */
  tokenId: number;
  /** ID проекта */
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
  projectId,
}: BotActionsProps) {
  const isStartingThisBot = startBotMutation.variables?.tokenId === tokenId;
  const isStoppingThisBot = stopBotMutation.variables?.tokenId === tokenId;
  const isDeletingThisBot = deleteBotMutation.variables === tokenId;

  const editLabel = isProfileLoading
    ? 'Загрузка информации о боте...'
    : 'Редактировать профиль бота';

  return (
    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
      <Button
        variant="ghost"
        size="sm"
        className="h-9 w-9 sm:h-8 sm:w-8 p-0"
        onClick={onEditProfile}
        disabled={isProfileLoading}
        title={editLabel}
        aria-label={editLabel}
        data-testid="button-edit-bot-profile"
      >
        <Edit2 className="h-4 w-4" />
      </Button>

      {!isBotRunning ? (
        <Button
          size="sm"
          onClick={() => startBotMutation.mutate({ tokenId, projectId })}
          disabled={startBotMutation.isPending && isStartingThisBot}
          aria-label={startBotMutation.isPending && isStartingThisBot ? 'Запуск бота...' : 'Запустить бота'}
          className="h-8 gap-1 sm:gap-2 px-2 sm:px-3 text-xs bg-green-600 hover:bg-green-700"
        >
          <Play className="w-3 h-3" aria-hidden="true" />
          <span className="hidden sm:inline">
            {startBotMutation.isPending && isStartingThisBot ? 'Запуск...' : 'Запустить'}
          </span>
          <span className="sm:hidden">
            {startBotMutation.isPending && isStartingThisBot ? '...' : 'Запуск'}
          </span>
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => stopBotMutation.mutate({ tokenId, projectId })}
          disabled={stopBotMutation.isPending && isStoppingThisBot}
          aria-label={stopBotMutation.isPending && isStoppingThisBot ? 'Остановка бота...' : 'Остановить бота'}
          className="h-8 gap-1 sm:gap-2 px-2 sm:px-3 text-xs"
        >
          <Square className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">
            {stopBotMutation.isPending && isStoppingThisBot ? 'Остановка...' : 'Остановить'}
          </span>
          <span className="sm:hidden">
            {stopBotMutation.isPending && isStoppingThisBot ? '...' : 'Стоп'}
          </span>
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            aria-label="Дополнительные действия с ботом"
            data-testid="button-bot-menu"
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => deleteBotMutation.mutate(tokenId)}
            className="text-red-600 dark:text-red-400"
            disabled={deleteBotMutation.isPending && isDeletingThisBot}
          >
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * @fileoverview Заголовок карточки бота
 *
 * Компонент отображает:
 * - Аватарку бота
 * - Имя бота (с inline-редактированием и подсказкой карандаша)
 * - Username бота
 * - Статус бота
 * - Кнопки действий
 *
 * @module BotCardHeader
 */

import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Pencil } from 'lucide-react';
import { BotAvatar } from './BotAvatar';
import { BotActions } from './BotActions';

interface BotCardHeaderProps {
  /** Данные токена бота */
  token: {
    id: number;
    botFirstName?: string;
    name?: string;
    botUsername?: string;
    botPhotoUrl?: string;
  };
  /** Информация о боте из Telegram API */
  projectBotInfo: { photoUrl?: string; id?: number } | null | undefined;
  /** Редактируемое поле */
  editingField: { tokenId: number; field: string } | null;
  /** Значение редактируемого поля */
  editValue: string;
  /** Обновить значение редактируемого поля */
  setEditValue: (value: string) => void;
  /** Сохранить изменения */
  handleSaveEdit: () => void;
  /** Отменить редактирование */
  handleCancelEdit: () => void;
  /** Начать редактирование поля */
  handleStartEdit: (tokenId: number, field: string, currentValue: string) => void;
  /** Получить бейдж статуса */
  getStatusBadge: (token: unknown) => JSX.Element;
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
  /** Загружается ли профиль */
  isProfileLoading: boolean;
  /** ID токена */
  tokenId: number;
  /** ID проекта */
  projectId: number;
}

/**
 * Заголовок карточки бота
 */
export function BotCardHeader({
  token,
  projectBotInfo,
  editingField,
  editValue,
  setEditValue,
  handleSaveEdit,
  handleCancelEdit,
  handleStartEdit,
  getStatusBadge,
  isBotRunning,
  startBotMutation,
  stopBotMutation,
  deleteBotMutation,
  onEditProfile,
  isProfileLoading,
  tokenId,
  projectId,
}: BotCardHeaderProps) {
  const isEditingName =
    editingField?.tokenId === token.id && editingField?.field === 'name';
  const displayName = token.botFirstName || token.name || '';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
      <BotAvatar
        botName={displayName}
        photoUrl={projectBotInfo?.photoUrl || token.botPhotoUrl}
        botId={projectBotInfo?.id?.toString()}
        projectId={projectId}
        size={64}
        className="flex-shrink-0"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {isEditingName ? (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                else if (e.key === 'Escape') handleCancelEdit();
              }}
              onBlur={handleSaveEdit}
              autoFocus
              aria-label="Редактировать имя бота"
              className="font-bold text-base sm:text-lg h-auto px-2 py-1 flex-1 min-w-0"
              data-testid="input-bot-name-edit"
            />
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="group/name flex items-center gap-1 font-bold text-base sm:text-lg cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors truncate text-left"
                    onDoubleClick={() =>
                      handleStartEdit(token.id, 'name', displayName)
                    }
                    aria-label={`Имя бота: ${displayName}. Двойной клик для редактирования`}
                    data-testid="text-bot-name"
                  >
                    {displayName}
                    <Pencil
                      className="w-3 h-3 text-muted-foreground opacity-0 group-hover/name:opacity-60 transition-opacity flex-shrink-0"
                      aria-hidden="true"
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Двойной клик для редактирования имени
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {token.botUsername && (
            <span className="text-xs sm:text-sm text-muted-foreground truncate">
              @{token.botUsername}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {getStatusBadge(token)}
        </div>
      </div>

      <BotActions
        isBotRunning={isBotRunning}
        startBotMutation={startBotMutation}
        stopBotMutation={stopBotMutation}
        deleteBotMutation={deleteBotMutation}
        onEditProfile={onEditProfile}
        isProfileLoading={isProfileLoading}
        tokenId={tokenId}
        projectId={projectId}
      />
    </div>
  );
}

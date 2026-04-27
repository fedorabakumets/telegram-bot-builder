/**
 * @fileoverview Заголовок карточки бота
 *
 * Отображает аватарку, имя, username, статус и кнопки действий.
 * Содержит кнопку-шеврон для сворачивания/разворачивания карточки.
 * При свёрнутом состоянии и запущенном боте показывает таймер.
 *
 * @module BotCardHeader
 */

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Pencil, ChevronUp, ChevronDown } from 'lucide-react';
import { BotAvatar } from './BotAvatar';
import { BotActions } from '../card/BotActions';
import { formatExecutionTime } from '../contexts/bot-control-utils';
import type { BotToken } from '@shared/schema';

/** Свойства заголовка карточки бота */
interface BotCardHeaderProps {
  /** Данные токена бота */
  token: Pick<BotToken, 'id' | 'botFirstName' | 'name' | 'botUsername' | 'botPhotoUrl' | 'isDefault'>;
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
  getStatusBadge: (token: Pick<BotToken, 'id' | 'botFirstName' | 'name' | 'botUsername' | 'botPhotoUrl' | 'isDefault'>) => JSX.Element;
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
  /** Свёрнута ли карточка */
  isCollapsed: boolean;
  /** Переключить состояние сворачивания */
  onToggleCollapse: () => void;
  /** Показывать ли таймер в свёрнутом виде */
  showTimer?: boolean;
  /** Текущее время выполнения по tokenId (секунды) */
  currentElapsedSeconds?: Record<number, number>;
}

/**
 * Заголовок карточки бота
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotCardHeader({
  token, projectBotInfo, editingField, editValue, setEditValue,
  handleSaveEdit, handleCancelEdit, handleStartEdit, getStatusBadge,
  isBotRunning, startBotMutation, stopBotMutation, deleteBotMutation,
  onEditProfile, isProfileLoading, tokenId, projectId,
  isCollapsed, onToggleCollapse, showTimer, currentElapsedSeconds,
}: BotCardHeaderProps) {
  const isEditingName = editingField?.tokenId === token.id && editingField?.field === 'name';
  const displayName = token.botFirstName || token.name || '';
  const elapsed = currentElapsedSeconds?.[tokenId] ?? 0;

  /** Кнопка-шеврон для сворачивания */
  const CollapseButton = (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 flex-shrink-0"
      onClick={onToggleCollapse}
      aria-label={isCollapsed ? 'Развернуть карточку' : 'Свернуть карточку'}
    >
      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
    </Button>
  );

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
      <div className="flex items-start justify-between sm:contents">
        <BotAvatar
          botName={displayName}
          photoUrl={projectBotInfo?.photoUrl || token.botPhotoUrl}
          botId={projectBotInfo?.id?.toString()}
          projectId={projectId}
          size={64}
          className="flex-shrink-0"
        />
        <div className="sm:hidden flex items-center gap-1">
          {CollapseButton}
          <BotActions
            isBotRunning={isBotRunning} startBotMutation={startBotMutation}
            stopBotMutation={stopBotMutation} deleteBotMutation={deleteBotMutation}
            onEditProfile={onEditProfile} isProfileLoading={isProfileLoading}
            tokenId={tokenId} projectId={projectId}
          />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {isEditingName ? (
            <Input
              value={editValue} onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); else if (e.key === 'Escape') handleCancelEdit(); }}
              onBlur={handleSaveEdit} autoFocus aria-label="Редактировать имя бота"
              className="font-bold text-base sm:text-lg h-auto px-2 py-1 flex-1 min-w-0"
              data-testid="input-bot-name-edit"
            />
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="group/name flex items-center gap-1 font-bold text-base sm:text-lg cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors text-left"
                    onDoubleClick={() => handleStartEdit(token.id, 'name', displayName)}
                    aria-label={`Имя бота: ${displayName}. Двойной клик для редактирования`}
                    data-testid="text-bot-name"
                  >
                    {displayName}
                    <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover/name:opacity-60 transition-opacity flex-shrink-0" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Двойной клик для редактирования имени</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {token.botUsername && (
            <span className="text-xs sm:text-sm text-muted-foreground">@{token.botUsername}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {getStatusBadge(token)}
          {showTimer && isCollapsed && elapsed > 0 && (
            <span className="text-xs text-muted-foreground">⏱ {formatExecutionTime(elapsed)}</span>
          )}
        </div>
      </div>

      {/* На десктопе кнопки справа */}
      <div className="hidden sm:flex items-center gap-1">
        {CollapseButton}
        <BotActions
          isBotRunning={isBotRunning} startBotMutation={startBotMutation}
          stopBotMutation={stopBotMutation} deleteBotMutation={deleteBotMutation}
          onEditProfile={onEditProfile} isProfileLoading={isProfileLoading}
          tokenId={tokenId} projectId={projectId}
        />
      </div>
    </div>
  );
}

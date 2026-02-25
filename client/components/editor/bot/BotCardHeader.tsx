/**
 * @fileoverview Заголовок карточки бота
 *
 * Компонент отображает:
 * - Аватарку бота
 * - Имя бота (с inline-редактированием)
 * - Username бота
 * - Статус бота
 * - Кнопки действий
 *
 * @module BotCardHeader
 */

import { Input } from '@/components/ui/input';
import { BotAvatar } from './BotAvatar';
import { BotActions } from './BotActions';

interface BotCardHeaderProps {
  token: any;
  editingField: { tokenId: number; field: string } | null;
  editValue: string;
  setEditValue: (value: string) => void;
  handleSaveEdit: () => void;
  handleCancelEdit: () => void;
  handleStartEdit: (tokenId: number, field: string, currentValue: string) => void;
  getStatusBadge: (token: any) => JSX.Element;
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
 * Заголовок карточки бота
 */
export function BotCardHeader({
  token,
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
  projectId
}: BotCardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
      <BotAvatar
        botName={token.botFirstName || token.name}
        photoUrl={token.botPhotoUrl}
        size={48}
        className="flex-shrink-0"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {editingField?.tokenId === token.id && editingField?.field === 'name' ? (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                else if (e.key === 'Escape') handleCancelEdit();
              }}
              onBlur={handleSaveEdit}
              autoFocus
              className="font-bold text-base sm:text-lg h-auto px-2 py-1 flex-1 min-w-0"
              data-testid="input-bot-name-edit"
            />
          ) : (
            <h3
              className="font-bold text-base sm:text-lg cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors truncate"
              onDoubleClick={() => handleStartEdit(token.id, 'name', token.botFirstName || token.name)}
              title="Double-click to edit"
              data-testid="text-bot-name"
            >
              {token.botFirstName || token.name}
            </h3>
          )}
          {token.botUsername && (
            <span className="text-xs sm:text-sm text-muted-foreground truncate">@{token.botUsername}</span>
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

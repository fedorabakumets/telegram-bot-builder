/**
 * @fileoverview Информация карточки бота
 *
 * Компонент отображает:
 * - Описание бота (с inline-редактированием)
 * - Токен бота
 * - Краткое описание
 * - Даты создания и последнего использования
 * - Время выполнения
 *
 * @module BotCardInfo
 */

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TokenDisplayEdit } from './TokenDisplayEdit';
import { formatExecutionTime } from './bot-control-utils';

interface BotCardInfoProps {
  token: any;
  project: any;
  editingField: { tokenId: number; field: string } | null;
  editValue: string;
  setEditValue: (value: string) => void;
  handleSaveEdit: () => void;
  handleCancelEdit: () => void;
  handleStartEdit: (tokenId: number, field: string, currentValue: string) => void;
  queryClient: any;
}

/**
 * Информация карточки бота
 */
export function BotCardInfo({
  token,
  project,
  editingField,
  editValue,
  setEditValue,
  handleSaveEdit,
  handleCancelEdit,
  handleStartEdit,
  queryClient
}: BotCardInfoProps) {
  return (
    <div className="flex-1 min-w-0">
      {(token.botDescription || token.description) && (
        editingField?.tokenId === token.id && editingField?.field === 'description' ? (
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSaveEdit();
              } else if (e.key === 'Escape') handleCancelEdit();
            }}
            onBlur={handleSaveEdit}
            autoFocus
            className="text-xs sm:text-sm resize-none min-h-[36px]"
            rows={2}
            data-testid="textarea-bot-description-edit"
          />
        ) : (
          <p
            className="text-xs sm:text-sm text-muted-foreground line-clamp-2 cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
            onDoubleClick={() => handleStartEdit(token.id, 'description', token.botDescription || token.description || '')}
            title="Double-click to edit"
            data-testid="text-bot-description"
          >
            {token.botDescription || token.description}
          </p>
        )
      )}

      <TokenDisplayEdit
        token={token.token}
        tokenId={token.id}
        projectId={project.id}
        onTokenUpdate={() => {
          queryClient.invalidateQueries({ queryKey: [`/api/projects/${project.id}/bot/info`] });
        }}
      />

      {token.botShortDescription && token.botShortDescription !== token.botDescription && (
        editingField?.tokenId === token.id && editingField?.field === 'shortDescription' ? (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit();
              else if (e.key === 'Escape') handleCancelEdit();
            }}
            onBlur={handleSaveEdit}
            autoFocus
            className="text-xs h-auto px-2 py-1 mb-1"
            data-testid="input-bot-short-description-edit"
          />
        ) : (
          <p
            className="text-xs text-muted-foreground line-clamp-1 cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
            onDoubleClick={() => handleStartEdit(token.id, 'shortDescription', token.botShortDescription || '')}
            title="Double-click to edit"
            data-testid="text-bot-short-description"
          >
            {token.botShortDescription}
          </p>
        )
      )}

      <p className="text-xs text-muted-foreground mt-1">
        Добавлен: {new Date(token.createdAt!).toLocaleDateString('ru-RU')}
        {token.lastUsedAt && (
          <> • Последний: {new Date(token.lastUsedAt).toLocaleDateString('ru-RU')}</>
        )}
        {token.trackExecutionTime === 1 && (
          <> • {formatExecutionTime(token.totalExecutionSeconds || 0)}</>
        )}
      </p>
    </div>
  );
}

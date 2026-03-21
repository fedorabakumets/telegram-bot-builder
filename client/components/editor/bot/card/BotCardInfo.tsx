/**
 * @fileoverview Информация карточки бота
 *
 * Отображает:
 * - Описание бота (с inline-редактированием)
 * - Токен бота и даты — в лёгком контейнере bg-muted/30
 * - Краткое описание
 *
 * @module BotCardInfo
 */

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TokenDisplayEdit } from '../token/TokenDisplayEdit';
import { formatExecutionTime } from '../contexts/bot-control-utils';
import type { BotToken, BotProject } from '@shared/schema';
import type { EditingField } from '../bot-types';

/**
 * Свойства компонента информации карточки бота
 */
interface BotCardInfoProps {
  /** Данные токена бота */
  token: BotToken;
  /** Проект бота */
  project: BotProject;
  /** Редактируемое поле */
  editingField: EditingField | null;
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
  /** QueryClient для инвалидации кэша */
  queryClient: { invalidateQueries: (opts: { queryKey: unknown[] }) => void };
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
  queryClient,
}: BotCardInfoProps) {
  const description = token.botDescription || token.description;
  const isEditingDesc = editingField?.tokenId === token.id && editingField?.field === 'description';
  const isEditingShort = editingField?.tokenId === token.id && editingField?.field === 'shortDescription';

  return (
    <div className="flex-1 min-w-0">
      {description && (
        isEditingDesc ? (
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); }
              else if (e.key === 'Escape') handleCancelEdit();
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
            onDoubleClick={() => handleStartEdit(token.id, 'description', description)}
            title="Double-click to edit"
            data-testid="text-bot-description"
          >
            {description}
          </p>
        )
      )}

      <div className="rounded-md bg-muted/30 px-3 py-2 space-y-1">
        <TokenDisplayEdit
          token={token.token}
          tokenId={token.id}
          projectId={project.id}
          onTokenUpdate={() => {
            queryClient.invalidateQueries({ queryKey: [`/api/projects/${project.id}/bot/info`] });
          }}
        />

        {token.botShortDescription && token.botShortDescription !== token.botDescription && (
          isEditingShort ? (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                else if (e.key === 'Escape') handleCancelEdit();
              }}
              onBlur={handleSaveEdit}
              autoFocus
              className="text-xs h-auto px-2 py-1"
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

        <p className="text-xs text-muted-foreground space-y-0.5 sm:space-y-0">
          <span className="block sm:inline">
            Добавлен: {new Date(token.createdAt!).toLocaleDateString('ru-RU')}
          </span>
          {token.lastUsedAt && (
            <span className="block sm:inline sm:before:content-['_•_']">
              Последний: {new Date(token.lastUsedAt).toLocaleDateString('ru-RU')}
            </span>
          )}
          {token.trackExecutionTime === 1 && (
            <span className="block sm:inline sm:before:content-['_•_']">
              {formatExecutionTime(token.totalExecutionSeconds || 0)}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

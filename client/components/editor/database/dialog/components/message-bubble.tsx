/**
 * @fileoverview Компонент пузыря сообщения
 * Координирует отображение всех частей сообщения с поддержкой удаления и редактирования
 */

import { useState, useEffect } from 'react';
import { Trash2, Loader2, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompactInlineEditor } from '@/components/editor/inline-rich/compact-inline-editor';
import { BotMessageWithMedia } from '../types';
import { Button as ButtonType } from '@shared/schema';
import type { UserBotData } from '@/types/bot';
import { MessageAvatar } from './message-avatar';
import { MessageMedia } from './message-media';
import { FormattedText } from './formatted-text';
import { MessageButtons } from './message-buttons';
import { ButtonClickedInfo } from './button-clicked-info';
import { MessageTimestamp } from './message-timestamp';
import { DialogButtonsEditor } from './dialog-buttons-editor';
import { hasButtons, getButtons, hasButtonClicked, getButtonText } from '../utils/message-utils';
import type { NodeWithSheet } from '../utils/node-utils';
import { isGroupSource } from '../utils/dialog-message-source';
import { SystemMessage } from './system-message';
import './message-actions.css';

/**
 * Свойства компонента сообщения
 */
interface MessageBubbleProps {
  /** Поисковая фраза для мягкой подсветки найденного слова. */
  highlightTerm?: string;
  /** Сообщение для отображения */
  message: BotMessageWithMedia;
  /** Индекс сообщения в списке */
  index: number;
  /** Данные пользователя для аватара */
  user?: UserBotData | null;
  /** Данные бота для аватара */
  bot?: UserBotData | null;
  /** Идентификатор проекта для прокси аватара */
  projectId?: number;
  /** Идентификатор токена для резолва аватара */
  tokenId?: number | null;
  /** Колбэк удаления сообщения */
  onDelete?: (messageId: number) => void;
  /** Идёт ли удаление этого сообщения */
  isDeleting?: boolean;
  /** Колбэк сохранения отредактированного текста и кнопок */
  onEdit?: (
    messageId: number,
    newText: string,
    originalText: string,
    buttons?: ButtonType[],
    buttonsPerRow?: number,
  ) => Promise<boolean>;
  /** Идёт ли сохранение редактирования */
  isEditing?: boolean;
  /** Флаг группового диалога — показывает имя отправителя над сообщением */
  isGroupDialog?: boolean;
  /** Показывать исходный чат сообщения в общей истории пользователя */
  showSource?: boolean;
  /** Узлы проекта для выбора цели действия goto в редакторе кнопок */
  availableNodes?: NodeWithSheet[];
  /** Открывает профиль бота или автора сообщения в любом диалоге. */
  onOpenMember?: (message: BotMessageWithMedia) => void;
}

/**
 * Проверяет, отправлено ли сообщение через рассылку
 * @param message - Сообщение
 * @returns true если сообщение из рассылки
 */
function isBroadcastMessage(message: BotMessageWithMedia): boolean {
  const data = message.messageData as Record<string, unknown> | null;
  return !!data?.sentFromBroadcast;
}

/** Медиа-плейсхолдеры — текст который не нужно показывать если есть медиа */
const MEDIA_PLACEHOLDERS = new Set(['[Фото]', '[медиа]', '[Photo]', '[Видео]', '[Аудио]', '[Голосовое]', '[Документ]', '[Стикер]']);

/**
 * Проверяет есть ли медиа для отображения (локальное или через file_id)
 * @param message - Сообщение
 * @returns true если есть что показать
 */
function hasVisibleMedia(message: BotMessageWithMedia): boolean {
  if (Array.isArray(message.media) && message.media.length > 0) return true;
  const data = message.messageData as Record<string, unknown> | null;
  if (!data) return false;
  return ['photo', 'video', 'audio', 'voice', 'document', 'sticker'].some(
    (type) => data[type] && typeof (data[type] as Record<string, unknown>)?.file_id === 'string'
  );
}

/**
 * Извлекает имя отправителя из messageData.from_user
 * @param message - Сообщение
 * @returns Отображаемое имя или null
 */
function getSenderName(message: BotMessageWithMedia): string | null {
  const data = message.messageData as Record<string, unknown> | null;
  const fromUser = data?.from_user as Record<string, string> | undefined;
  if (!fromUser) return null;
  const name = [fromUser.first_name, fromUser.last_name].filter(Boolean).join(' ').trim();
  return name || fromUser.username || String(message.userId) || null;
}

/**
 * Компонент отображения одного сообщения с кнопками удаления и редактирования при наведении
 * @param props - Свойства компонента
 * @returns JSX элемент сообщения
 */
export function MessageBubble({
  highlightTerm,
  message, index, user, bot, projectId, tokenId,
  onDelete, isDeleting, onEdit, isEditing, isGroupDialog, showSource, availableNodes, onOpenMember,
}: MessageBubbleProps) {
  const isBot = message.messageType === 'bot';
  const isUser = message.messageType === 'user';
  /** Профиль бота и автора доступен как в личном, так и в групповом диалоге. */
  const canOpenMember = !!onOpenMember && (isBot || (isUser && /^[1-9]\d*$/.test(String(message.userId ?? ''))));
  const messageType: 'bot' | 'user' = isBot ? 'bot' : 'user';

  /** Режим inline-редактирования */
  const [isEditMode, setIsEditMode] = useState(false);
  /** Текущий текст в редакторе (HTML) */
  const [editText, setEditText] = useState('');
  /** Локальное состояние инлайн-кнопок в режиме редактирования */
  const [editButtons, setEditButtons] = useState<ButtonType[]>([]);
  /** Локальное состояние раскладки кнопок по рядам (0 = авто) */
  const [editButtonsPerRow, setEditButtonsPerRow] = useState(0);

  /** Сбрасываем режим редактирования при смене сообщения */
  useEffect(() => {
    setIsEditMode(false);
  }, [message.id]);

  /** Скрываем служебный текст, если нажатие уже показано отдельной меткой. */
  const isButtonPlaceholder = isUser && hasButtonClicked(message) && !!getButtonText(message)
    && message.messageText?.trim() === `[Нажата кнопка: ${(message.messageData as Record<string, unknown>)?.button_text}]`;
  /** Скрываем текст-плейсхолдер, если медиа или нажатие уже отображается. */
  const displayText = isButtonPlaceholder || (hasVisibleMedia(message) && MEDIA_PLACEHOLDERS.has(message.messageText ?? ''))
    ? null
    : message.messageText;

  /** Показывать ли кнопку удаления */
  const showDeleteButton = isBot && message.id > 0 && !!message.telegramMessageId && !!onDelete && !isEditMode;
  /** Показывать ли кнопку редактирования */
  const showEditButton = isBot && message.id > 0 && !!message.telegramMessageId && !!onEdit && !isEditMode;

  /** Открывает режим редактирования — передаём HTML как есть в редактор */
  const handleOpenEdit = () => {
    setEditText(displayText ?? '');
    // Инициализируем кнопки и раскладку из данных сообщения
    setEditButtons(getButtons(message) as ButtonType[]);
    const data = message.messageData as Record<string, unknown> | null;
    setEditButtonsPerRow(typeof data?.buttonsPerRow === 'number' ? data.buttonsPerRow : 0);
    setIsEditMode(true);
  };

  /** Сохраняет отредактированный текст и кнопки */
  const handleSave = async () => {
    if (!onEdit) return;
    const saved = await onEdit(message.id, editText, displayText ?? '', editButtons, editButtonsPerRow);
    if (saved) setIsEditMode(false);
  };

  /** Отменяет редактирование */
  const handleCancel = () => setIsEditMode(false);

  /** Исходные кнопки и раскладка сообщения для сравнения изменений */
  const originalButtons = getButtons(message);
  const originalButtonsPerRow =
    typeof (message.messageData as Record<string, unknown> | null)?.buttonsPerRow === 'number'
      ? ((message.messageData as Record<string, number>).buttonsPerRow)
      : 0;
  /** Изменились ли кнопки или раскладка по сравнению с исходными */
  const buttonsChanged =
    JSON.stringify(editButtons) !== JSON.stringify(originalButtons) ||
    editButtonsPerRow !== originalButtonsPerRow;
  /** Изменился ли текст по сравнению с исходным */
  const textChanged = editText !== (displayText ?? '');
  /** Сохранение запрещено, если текст пуст либо ничего не изменилось */
  const isSaveDisabled = editText.trim() === '' || (!textChanged && !buttonsChanged);

  if (message.messageType === 'system') {
    return <SystemMessage text={message.messageText} data={message.messageData} createdAt={message.createdAt} />;
  }

  return (
    <div
      className={`flex ${isBot ? 'justify-end' : 'justify-start'}`}
      data-message-id={message.id}
      data-testid={`dialog-message-${message.messageType}-${index}`}
    >
      <div
        className={`dialog-message-shell flex items-start gap-2 min-w-0 ${isEditMode ? 'w-full max-w-full flex-col' : `max-w-[85%] ${isBot ? 'flex-row-reverse' : 'flex-row'}`}`}
      >
        {canOpenMember ? <button type="button" aria-label={isBot ? "Открыть профиль бота" : `Открыть профиль ${getSenderName(message) ?? message.userId}`} onClick={() => onOpenMember?.(message)} className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><MessageAvatar
          messageType={messageType} user={isUser ? user : null} bot={isBot ? bot : null} projectId={projectId} tokenId={tokenId ?? message.tokenId}
        /></button> : <MessageAvatar
          messageType={messageType}
          user={isUser ? user : null}
          bot={isBot ? bot : null}
          projectId={projectId}
          tokenId={tokenId ?? message.tokenId}
        />}

        {/* Место для действий сохраняется при наведении и клавиатурном фокусе. */}
        {(showEditButton || showDeleteButton) && <div className="dialog-message-actions" role="group"
          aria-label="Действия с сообщением" data-busy={isEditing || isDeleting}>
          {showEditButton && (
            <Button
              variant="ghost"
              size="icon"
              className="dialog-message-action"
              aria-label="Редактировать сообщение"
              onClick={handleOpenEdit}
              disabled={isEditing}
              title="Редактировать сообщение"
            >
              {isEditing
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <Pencil className="h-3 w-3" />
              }
            </Button>
          )}
          {showDeleteButton && (
            <Button
              variant="ghost"
              size="icon"
              className="dialog-message-action"
              data-action="delete"
              aria-label="Удалить сообщение"
              onClick={() => onDelete(message.id)}
              disabled={isDeleting}
              title="Удалить сообщение"
            >
              {isDeleting
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <Trash2 className="h-3 w-3" />
            }
            </Button>
          )}
        </div>}

        <div className={`flex flex-col gap-1 min-w-0 ${isEditMode ? "w-full" : ""}`} onDoubleClick={isBot && message.id > 0 && !!message.telegramMessageId && !!onEdit ? handleOpenEdit : undefined}>
          {showSource && isGroupSource(message.chatType) && (
            <span className="text-[10px] font-medium text-muted-foreground px-1 break-words">
              {`Группа: ${message.sourceChatTitle || message.chatId}`}
            </span>
          )}
          {/* Имя отправителя в групповом диалоге — показывается над сообщением пользователя */}
          {isGroupDialog && isUser && (canOpenMember ? (
            <button type="button" onClick={() => onOpenMember?.(message)} className="self-start text-left text-[10px] font-medium text-violet-600 dark:text-violet-400 px-1 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {getSenderName(message) ?? message.userId}
            </button>
          ) : <span className="text-[10px] font-medium text-violet-600 dark:text-violet-400 px-1">{getSenderName(message) ?? message.userId}</span>)}
          <MessageMedia
            media={message.media}
            messageData={message.messageData}
            projectId={projectId}
            tokenId={message.tokenId ?? undefined}
          />

          {/* Редактор занимает доступную ширину панели без фиксированного минимума. */}
          {isEditMode ? (
            <div className="flex w-full min-w-0 flex-col gap-1">
              <CompactInlineEditor
                value={editText}
                onChange={setEditText}
                placeholder="Введите текст сообщения..."
              />
              {/* Редактор инлайн-кнопок — позволяет менять клавиатуру при правке */}
              <DialogButtonsEditor
                buttons={editButtons}
                onChange={setEditButtons}
                availableNodes={availableNodes}
                buttonsPerRow={editButtonsPerRow}
                onButtonsPerRowChange={setEditButtonsPerRow}
              />
              <div className="dialogs-edit-actions flex flex-wrap gap-1 justify-end">
                <Button
                  size="sm"
                  variant="default"
                  className="h-6 px-2 text-xs"
                  onClick={handleSave}
                  disabled={isSaveDisabled || isEditing}
                >
                  {isEditing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  <span className="ml-1">Сохранить</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={handleCancel}
                  disabled={isEditing}
                >
                  <X className="h-3 w-3" />
                  <span className="ml-1">Отмена</span>
                </Button>
              </div>
            </div>
          ) : (
            <FormattedText text={displayText} messageType={messageType} highlightTerm={highlightTerm} />
          )}

          {isBot && hasButtons(message) && (
            <MessageButtons buttons={getButtons(message)} index={index} />
          )}

          {isUser && hasButtonClicked(message) && (
            <ButtonClickedInfo buttonText={getButtonText(message)} />
          )}

          <MessageTimestamp createdAt={message.createdAt} />

          {isBot && isBroadcastMessage(message) && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              📢 Рассылка
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

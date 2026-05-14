/**
 * @fileoverview Пузырь сообщения рассылки с кнопками удаления и редактирования при наведении
 * @module editor/database/dialog/components/broadcast-message-bubble
 */

import { useState, useMemo } from 'react';
import { Trash2, Loader2, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompactInlineEditor } from '@/components/editor/inline-rich/compact-inline-editor';
import { parseHTML } from '@/components/editor/inline-rich/utils/formatting-parser';
import type { Broadcast } from '@shared/schema';

/**
 * Пропсы компонента BroadcastMessageBubble
 */
interface BroadcastMessageBubbleProps {
  /** Данные рассылки */
  broadcast: Broadcast;
  /** Колбэк удаления рассылки */
  onDelete?: (broadcastId: number) => void;
  /** Идёт ли удаление этой рассылки */
  isDeleting?: boolean;
  /** Колбэк повтора рассылки (открывает wizard с тем же текстом) */
  onRepeat?: (broadcastId: number) => void;
  /** Колбэк редактирования рассылки */
  onEdit?: (broadcastId: number, newText: string) => void;
  /** Идёт ли редактирование этой рассылки */
  isEditing?: boolean;
}

/**
 * Возвращает цвет и текст бейджа статуса рассылки
 * @param status - Статус рассылки
 * @returns Объект с классом и текстом
 */
function getStatusBadge(status: string): { className: string; label: string } {
  switch (status) {
    case 'done':
      return { className: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300', label: 'Завершена' };
    case 'running':
      return { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300', label: 'Отправка...' };
    case 'stopped':
      return { className: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300', label: 'Остановлена' };
    default:
      return { className: 'bg-muted text-muted-foreground', label: status };
  }
}

/**
 * Форматирует дату рассылки
 * @param date - Дата создания
 * @returns Строка с датой и временем
 */
function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/**
 * Компонент пузыря рассылки — отображает одну рассылку как сообщение бота
 * с кнопками удаления и редактирования при наведении
 * @param props - Свойства компонента
 * @returns JSX элемент пузыря рассылки
 */
export function BroadcastMessageBubble({ broadcast, onDelete, isDeleting, onRepeat, onEdit, isEditing }: BroadcastMessageBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState(broadcast.messageText ?? '');
  const badge = getStatusBadge(broadcast.status);
  const isRunning = broadcast.status === 'running';
  const statsIcon = isRunning ? '⏳' : '✓';
  const count = isRunning ? broadcast.sentCount : broadcast.deliveredCount;

  /** Парсим HTML-текст рассылки */
  const content = useMemo(() => {
    if (!broadcast.messageText?.trim()) return null;
    return parseHTML(broadcast.messageText.trimEnd());
  }, [broadcast.messageText]);

  /** Показывать ли кнопку удаления */
  const showDelete = !!onDelete && (isHovered || isDeleting) && !editMode;
  /** Показывать ли кнопку редактирования */
  const showEdit = !!onEdit && isHovered && !isDeleting && !editMode;

  /** Начать редактирование */
  const handleStartEdit = () => {
    setEditText(broadcast.messageText ?? '');
    setEditMode(true);
  };

  /** Сохранить редактирование */
  const handleSaveEdit = () => {
    if (editText.trim() && onEdit) {
      onEdit(broadcast.id, editText.trim());
      setEditMode(false);
    }
  };

  /** Отменить редактирование */
  const handleCancelEdit = () => {
    setEditMode(false);
    setEditText(broadcast.messageText ?? '');
  };

  return (
    <div
      className="flex justify-end"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Кнопки действий — слева от пузыря, видны при наведении */}
      <div className="flex flex-col gap-0.5 self-center mr-1">
        {showEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
            onClick={handleStartEdit}
            title="Редактировать рассылку"
          >
            <Pencil className="h-3 w-3" />
          </Button>
        )}
        {showDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete!(broadcast.id)}
            disabled={isDeleting}
            title="Удалить рассылку"
          >
            {isDeleting
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <Trash2 className="h-3 w-3" />
            }
          </Button>
        )}
      </div>

      <div className="max-w-[85%] space-y-1">
        {/* Режим редактирования */}
        {editMode ? (
          <div className="rounded-lg px-3 py-2 bg-gradient-to-br from-violet-100 to-fuchsia-50 dark:from-violet-900/50 dark:to-fuchsia-900/30">
            <div className="flex flex-col gap-1 min-w-[260px]">
              <CompactInlineEditor
                value={editText}
                onChange={setEditText}
                placeholder="Текст рассылки..."
              />
              <div className="flex gap-1 justify-end">
                <Button
                  size="sm"
                  variant="default"
                  className="h-6 px-2 text-xs"
                  onClick={handleSaveEdit}
                  disabled={!editText.trim() || isEditing}
                >
                  {isEditing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  <span className="ml-1">Сохранить</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={handleCancelEdit}
                  disabled={isEditing}
                >
                  <X className="h-3 w-3" />
                  <span className="ml-1">Отмена</span>
                </Button>
              </div>
            </div>
          </div>
        ) : content && (
          <div className="rounded-lg px-3 py-2 bg-gradient-to-br from-violet-100 to-fuchsia-50 dark:from-violet-900/50 dark:to-fuchsia-900/30 text-violet-900 dark:text-violet-100">
            <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
          </div>
        )}

        {/* Мета-информация: дата, статистика, бейдж */}
        <div className="flex items-center justify-end gap-2 px-1">
          <span className="text-[10px] text-muted-foreground">
            {formatDate(broadcast.createdAt)}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {statsIcon} {count}/{broadcast.totalCount}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${badge.className}`}>
            {badge.label}
          </span>
        </div>
      </div>
    </div>
  );
}

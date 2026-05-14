/**
 * @fileoverview Пузырь сообщения рассылки в стиле чата
 * @module editor/database/dialog/components/broadcast-message-bubble
 */

import { useMemo } from 'react';
import { parseHTML } from '@/components/editor/inline-rich/utils/formatting-parser';
import type { Broadcast } from '@shared/schema';

/**
 * Пропсы компонента BroadcastMessageBubble
 */
interface BroadcastMessageBubbleProps {
  /** Данные рассылки */
  broadcast: Broadcast;
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
 * @param props - Свойства компонента
 * @returns JSX элемент пузыря рассылки
 */
export function BroadcastMessageBubble({ broadcast }: BroadcastMessageBubbleProps) {
  const badge = getStatusBadge(broadcast.status);
  const isRunning = broadcast.status === 'running';
  const statsIcon = isRunning ? '⏳' : '✓';
  const count = isRunning ? broadcast.sentCount : broadcast.deliveredCount;

  /** Парсим HTML-текст рассылки */
  const content = useMemo(() => {
    if (!broadcast.messageText?.trim()) return null;
    return parseHTML(broadcast.messageText.trimEnd());
  }, [broadcast.messageText]);

  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] space-y-1">
        {/* Текст рассылки в пузыре с фиолетовым градиентом */}
        {content && (
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

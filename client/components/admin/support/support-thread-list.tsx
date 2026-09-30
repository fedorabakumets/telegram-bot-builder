/**
 * @fileoverview Список диалогов поддержки в панели управления
 * @module components/admin/support/support-thread-list
 */

import { Link } from 'wouter';
import type { AdminSupportThreadListItem } from '@shared/support/support.types';
import { cn } from '@/utils/utils';
import { PlatformUserAvatar, formatPlatformUserName } from '../users/platform-user-avatar';

/** Пропсы списка диалогов */
interface SupportThreadListProps {
  /** Диалоги */
  items: AdminSupportThreadListItem[];
  /** Выбранный диалог */
  selectedId: number | null;
}

/**
 * Форматирует время последнего сообщения: сегодня — часы, иначе дата
 * @param iso - Дата в ISO
 * @returns Короткая строка времени
 */
function formatShortTime(iso: string): string {
  const date = new Date(iso);
  const isToday = date.toDateString() === new Date().toDateString();
  return isToday
    ? date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

/**
 * Список диалогов с превью последнего сообщения и счётчиком непрочитанного
 * @param props - Свойства компонента
 * @returns JSX элемент списка
 */
export function SupportThreadList({ items, selectedId }: SupportThreadListProps) {
  if (items.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">Диалогов нет.</p>;
  }

  return (
    <ul className="divide-y">
      {items.map((item) => {
        const { user } = item;
        const name = formatPlatformUserName(user.firstName, user.lastName, user.username, user.id);
        const preview = item.lastMessageText
          ? `${item.lastMessageSender === 'admin' ? 'Вы: ' : ''}${item.lastMessageText}`
          : '—';

        return (
          <li key={item.id}>
            <Link
              href={`/admin/support/${item.id}`}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/60',
                selectedId === item.id && 'bg-muted',
              )}
            >
              <PlatformUserAvatar photoUrl={user.photoUrl} name={name} userId={user.id} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium">{name}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {formatShortTime(item.lastMessageAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-muted-foreground">{preview}</span>
                  {item.unreadByAdmin > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-semibold text-white">
                      {item.unreadByAdmin}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

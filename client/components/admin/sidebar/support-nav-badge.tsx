/**
 * @fileoverview Счётчик непрочитанных сообщений поддержки в боковом меню
 * @module components/admin/sidebar/support-nav-badge
 */

import { cn } from '@/utils/utils';
import { useAdminSupportUnread } from '../hooks/use-admin-support';

/** Пропсы счётчика */
interface SupportNavBadgeProps {
  /** Свёрнуто ли боковое меню — тогда показываем точку */
  isCollapsed?: boolean;
}

/**
 * Красный счётчик сообщений, ожидающих ответа; ничего не рисует при нуле
 * @param props - Свойства компонента
 * @returns JSX элемент счётчика или null
 */
export function SupportNavBadge({ isCollapsed }: SupportNavBadgeProps) {
  const { data } = useAdminSupportUnread();
  const total = data?.total ?? 0;
  if (total === 0) return null;

  return (
    <span
      className={cn(
        'rounded-full bg-red-500 font-semibold text-white',
        isCollapsed
          ? 'absolute right-1 top-1 h-2 w-2'
          : 'ml-auto flex h-5 min-w-5 items-center justify-center px-1.5 text-[11px]',
      )}
    >
      {isCollapsed ? null : total > 99 ? '99+' : total}
    </span>
  );
}

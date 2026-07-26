/**
 * @fileoverview Секция пользователя
 * @description Отображает информацию о пользователе и кнопку выхода
 */

import { cn } from '@/utils/utils';
import { UserAvatar } from './user-avatar';
import { UserInfo } from './user-info';
import { LogoutButton } from './logout-button';
import type { TelegramUser } from '@/types/telegram-user';

export type { TelegramUser };

/**
 * Свойства секции пользователя
 */
export interface UserSectionProps {
  /** Данные пользователя */
  user: TelegramUser;
  /** Обработчик выхода */
  onLogout: () => void;
  /** Вертикальное расположение */
  isVertical?: boolean;
  /** Дополнительные CSS-классы */
  className?: string;
}

/**
 * Секция с информацией о пользователе и кнопкой выхода
 */
export function UserSection({ user, onLogout, isVertical, className }: UserSectionProps) {
  return (
    <div className={cn(
      'flex min-w-0 items-center space-x-1.5 rounded-lg border border-blue-400/20 bg-gradient-to-r from-blue-500/15 to-cyan-500/10 px-2 py-1.5 shadow-md shadow-blue-500/10 backdrop-blur-md dark:border-blue-500/30 dark:from-blue-700/25 dark:to-cyan-600/20 xl:space-x-2.5 xl:px-3',
      isVertical ? 'w-full' : '',
      className
    )}>
      <UserAvatar photoUrl={user.photoUrl} />
      <UserInfo firstName={user.firstName} username={user.username} isVertical={isVertical} />
      <LogoutButton onClick={onLogout} isVertical={isVertical} />
    </div>
  );
}

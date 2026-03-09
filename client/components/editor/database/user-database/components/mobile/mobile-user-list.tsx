/**
 * @fileoverview Компонент мобильного списка пользователей
 * @description Отображает список пользователей в виде карточек для мобильных устройств
 */

import { UserBotData } from '@shared/schema';
import { MobileEmptyState } from './mobile-empty-state';
import { MobileUserCard } from './mobile-user-card';

/**
 * Пропсы компонента MobileUserList
 */
interface MobileUserListProps {
  /** Список пользователей */
  users: UserBotData[];
  /** Поисковый запрос */
  searchQuery: string;
  /** Функция форматирования имени */
  formatUserName: (user: UserBotData) => string;
  /** Функция открытия панели деталей */
  onOpenUserDetailsPanel?: (user: UserBotData) => void;
  /** Функция открытия диалога */
  onOpenDialogPanel?: (user: UserBotData) => void;
  /** Функция переключения статуса */
  handleUserStatusToggle: (user: UserBotData, field: 'isActive' | 'isBlocked' | 'isPremium') => void;
}

/**
 * Компонент мобильного списка пользователей
 * @param props - Пропсы компонента
 * @returns JSX компонент списка
 */
export function MobileUserList(props: MobileUserListProps): React.JSX.Element {
  const { users, searchQuery } = props;

  if (users.length === 0) {
    return <MobileEmptyState searchQuery={searchQuery} />;
  }

  return (
    <div className="space-y-3 sm:space-y-4 w-full">
      {users.map((user, index) => (
        <MobileUserCard key={user.id || index} user={user} index={index} {...props} />
      ))}
    </div>
  );
}

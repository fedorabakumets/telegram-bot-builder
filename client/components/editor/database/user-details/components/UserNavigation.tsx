/**
 * @fileoverview Компонент навигации между пользователями
 * @description Кнопки переключения предыдущий/следующий пользователь
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { UserBotData } from '@shared/schema';

/**
 * @interface UserNavigationProps
 * @description Свойства навигации
 */
interface UserNavigationProps {
  /** Текущий пользователь */
  user: UserBotData;
  /** Все пользователи */
  users: UserBotData[];
  /** Функция выбора пользователя */
  onSelectUser: (user: UserBotData) => void;
}

/**
 * Компонент навигации между пользователями
 * @param {UserNavigationProps} props - Свойства компонента
 * @returns {JSX.Element} Навигация
 */
export function UserNavigation({ user, users, onSelectUser }: UserNavigationProps): React.JSX.Element {
  const currentIndex = users.findIndex(u => u.userId === user.userId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < users.length - 1;

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => onSelectUser(users[currentIndex - 1])}
        disabled={!hasPrev}
        data-testid="button-prev-user"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => onSelectUser(users[currentIndex + 1])}
        disabled={!hasNext}
        data-testid="button-next-user"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

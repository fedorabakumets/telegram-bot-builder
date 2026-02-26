/**
 * @fileoverview Компонент заголовка мобильной карточки пользователя
 * @description Отображает имя, ID и кнопки действий
 */

import { Button } from '@/components/ui/button';
import { Eye, MessageSquare, UserCheck, UserX } from 'lucide-react';
import { UserBotData } from '@shared/schema';

/**
 * Пропсы компонента MobileUserHeader
 */
interface MobileUserHeaderProps {
  /** Данные пользователя */
  user: UserBotData;
  /** Функция форматирования имени */
  formatUserName: (user: UserBotData) => string;
  /** Функция открытия панели деталей */
  onOpenUserDetailsPanel?: (user: UserBotData) => void;
  /** Функция открытия диалога */
  onOpenDialogPanel?: (user: UserBotData) => void;
  /** Функция переключения статуса */
  handleUserStatusToggle: (user: UserBotData, field: 'isActive' | 'isBlocked' | 'isPremium') => void;
  /** Индекс пользователя в списке */
  index: number;
}

/**
 * Компонент заголовка мобильной карточки пользователя
 * @param props - Пропсы компонента
 * @returns JSX компонент заголовка
 */
export function MobileUserHeader(props: MobileUserHeaderProps): React.JSX.Element {
  const {
    user,
    formatUserName,
    onOpenUserDetailsPanel,
    onOpenDialogPanel,
    handleUserStatusToggle,
    index,
  } = props;

  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="font-medium text-base">{formatUserName(user)}</div>
        <div className="text-sm text-muted-foreground">ID: {user.id}</div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          data-testid={`button-view-user-${index}`}
          onClick={() => onOpenUserDetailsPanel?.(user)}
        >
          <Eye className="w-3 h-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          data-testid={`button-show-dialog-${index}`}
          onClick={() => onOpenDialogPanel?.(user)}
        >
          <MessageSquare className="w-3 h-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          data-testid={`button-toggle-active-${index}`}
          onClick={() => handleUserStatusToggle(user, 'isActive')}
          className={user.isActive === 1 ? 'text-red-600' : 'text-green-600'}
        >
          {user.isActive === 1 ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
        </Button>
      </div>
    </div>
  );
}

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
  /** Установка выбранного пользователя */
  setSelectedUser: (user: UserBotData) => void;
  /** Установка флага показа деталей */
  setShowUserDetails: (show: boolean) => void;
  /** Установка выбранного пользователя для диалога */
  setSelectedUserForDialog: (user: UserBotData) => void;
  /** Установка флага показа диалога */
  setShowDialog: (show: boolean) => void;
  /** Прокрутка вниз */
  scrollToBottom: () => void;
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
    setSelectedUser,
    setShowUserDetails,
    setSelectedUserForDialog,
    setShowDialog,
    scrollToBottom,
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
          onClick={() => {
            if (onOpenUserDetailsPanel) {
              onOpenUserDetailsPanel(user);
            } else {
              setSelectedUser(user);
              setShowUserDetails(true);
            }
          }}
        >
          <Eye className="w-3 h-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          data-testid={`button-show-dialog-${index}`}
          onClick={() => {
            if (onOpenDialogPanel) {
              onOpenDialogPanel(user);
            } else {
              setSelectedUserForDialog(user);
              setShowDialog(true);
              setTimeout(() => scrollToBottom(), 200);
            }
          }}
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

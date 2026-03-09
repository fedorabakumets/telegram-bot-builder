/**
 * @fileoverview Компонент сетки основной информации пользователя
 * @description Отображает основную информацию и статистику
 */

import { Label } from '@/components/ui/label';
import { UserBotData } from '@shared/schema';

/**
 * Пропсы компонента UserInfoGrid
 */
interface UserInfoGridProps {
  /** Данные пользователя */
  selectedUser: UserBotData;
  /** Количество сообщений пользователя */
  userMessageCounts: { userSent: number; botSent: number; total: number };
  /** Флаг мобильного режима */
  isMobile: boolean;
}

/**
 * Компонент сетки основной информации
 * @param props - Пропсы компонента
 * @returns JSX компонент сетки
 */
export function UserInfoGrid({
  selectedUser,
  userMessageCounts,
  isMobile,
}: UserInfoGridProps): React.JSX.Element {
  return (
    <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
      <div>
        <Label className="text-sm font-medium">Основная информация</Label>
        <div className="mt-2 space-y-2">
          <div>
            <span className="text-sm text-muted-foreground">Имя:</span>{' '}
            {selectedUser.firstName || 'Не указано'}
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Username:</span>{' '}
            {selectedUser.userName ? `@${selectedUser.userName}` : 'Не указано'}
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Telegram ID:</span>{' '}
            {selectedUser.userId}
          </div>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium">Статистика</Label>
        <div className="mt-2 space-y-2">
          <div>
            <span className="text-sm text-muted-foreground">Всего сообщений:</span>{' '}
            {userMessageCounts.total || selectedUser.interactionCount || 0}
          </div>
          <div>
            <span className="text-sm text-muted-foreground">От пользователя:</span>{' '}
            {userMessageCounts.userSent}
          </div>
          <div>
            <span className="text-sm text-muted-foreground">От бота:</span>{' '}
            {userMessageCounts.botSent}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          На основе истории диалога между пользователем и ботом
        </p>
      </div>
    </div>
  );
}

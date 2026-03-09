/**
 * @fileoverview Компонент заголовка панели пользователя
 * @description Отображает заголовок с именем и кнопкой закрытия
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, X } from 'lucide-react';
import { UserBotData } from '@shared/schema';

/**
 * @interface PanelHeaderProps
 * @description Свойства заголовка панели
 */
interface PanelHeaderProps {
  /** Данные пользователя */
  user: UserBotData;
  /** Все пользователи */
  users: UserBotData[];
  /** Функция закрытия панели */
  onClose: () => void;
  /** Форматированное имя пользователя */
  formatUserName: (user: UserBotData | null) => string;
  /** Функция выбора пользователя */
  onSelectUser?: (user: UserBotData) => void;
  /** Идентификатор проекта для прокси аватара */
  projectId?: number;
}

/**
 * Компонент аватара пользователя
 */
function UserAvatar({ user, projectId, formatUserName }: { user: UserBotData; projectId?: number; formatUserName: (user: UserBotData | null) => string }) {
  const hasPhoto = user?.avatarUrl && projectId && user?.userId;

  if (hasPhoto) {
    const avatarUrl = `/api/projects/${projectId}/users/${user.userId}/avatar`;

    return (
      <img
        src={avatarUrl}
        alt={formatUserName(user)}
        className="w-7 xs:w-7 sm:w-8 h-7 xs:h-7 sm:h-8 rounded-full object-cover flex-shrink-0"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
          const imgElement = e.target as HTMLImageElement;
          const fallback = imgElement.parentElement?.querySelector('.fallback-avatar') as HTMLElement | null;
          if (fallback) fallback.style.display = 'flex';
        }}
      />
    );
  }

  return (
    <div className="w-7 xs:w-7 sm:w-8 h-7 xs:h-7 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
      <User className="w-3.5 xs:w-3.5 sm:w-4 h-3.5 xs:h-3.5 sm:h-4 text-white" />
    </div>
  );
}

/**
 * Компонент заголовка панели
 * @param {PanelHeaderProps} props - Свойства компонента
 * @returns {JSX.Element} Элемент заголовка
 */
export function PanelHeader({ user, users, onClose, formatUserName, onSelectUser, projectId }: PanelHeaderProps): React.JSX.Element {
  console.log('[PanelHeader] Current user:', user, 'onSelectUser:', !!onSelectUser);
  
  return (
    <div className="flex items-center justify-between gap-2 p-2 xs:p-2.5 sm:p-3 border-b">
      <div className="flex items-center gap-2 min-w-0">
        <UserAvatar user={user} projectId={projectId} formatUserName={formatUserName} />
        <div className="min-w-0">
          <h3 className="font-medium text-xs xs:text-xs sm:text-sm truncate">Детали пользователя</h3>
          <Select
            value={user.userId.toString()}
            onValueChange={(value) => {
              console.log('[PanelHeader] Select value changed to:', value);
              const selectedUser = users.find((u) => u.userId.toString() === value);
              console.log('[PanelHeader] Found selectedUser:', selectedUser);
              if (selectedUser && onSelectUser) {
                console.log('[PanelHeader] Calling onSelectUser with:', selectedUser);
                onSelectUser(selectedUser);
              }
            }}
          >
            <SelectTrigger className="w-full h-7 text-[10px] xs:text-[10px] sm:text-xs px-2 py-0.5 border-0 shadow-none bg-transparent hover:bg-accent/50 focus:ring-0 focus:ring-offset-0 [&>span]:text-muted-foreground [&>span]:leading-tight">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.userId} value={u.userId.toString()}>
                  {formatUserName(u)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        data-testid="button-close-user-details-panel"
        className="h-7 w-7 xs:h-8 xs:w-8 sm:h-9 sm:w-9 flex-shrink-0"
      >
        <X className="w-3.5 xs:w-4 h-3.5 xs:h-4" />
      </Button>
    </div>
  );
}

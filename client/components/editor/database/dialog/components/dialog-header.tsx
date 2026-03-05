/**
 * @fileoverview Компонент заголовка панели диалога
 * Отображает иконку, селектор пользователей, кнопку закрытия и подсказку с предупреждением
 */

import { X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserBotData } from '@shared/schema';
import { WarningTooltip } from './warning-tooltip';

/**
 * Свойства заголовка
 */
interface DialogHeaderProps {
  /** Текущий пользователь */
  user: UserBotData;
  /** Все пользователи */
  users: UserBotData[];
  /** Функция форматирования имени */
  formatUserName: (user: UserBotData) => string;
  /** Функция выбора пользователя */
  onSelectUser: (user: UserBotData) => void;
  /** Колбэк закрытия */
  onClose: () => void;
}

/**
 * Компонент заголовка панели диалога
 */
export function DialogHeader({
  user,
  users,
  formatUserName,
  onSelectUser,
  onClose
}: DialogHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2 p-2 xs:p-2.5 sm:p-3 border-b">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="w-7 xs:w-7 sm:w-8 h-7 xs:h-7 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-3.5 xs:w-3.5 sm:w-4 h-3.5 xs:h-3.5 sm:h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-medium text-xs xs:text-xs sm:text-sm truncate leading-none">Диалог</h3>
            <WarningTooltip />
          </div>
          <Select
            value={user.userId.toString()}
            onValueChange={(value) => {
              const selectedUser = users.find((u) => u.userId.toString() === value);
              if (selectedUser) {
                onSelectUser(selectedUser);
              }
            }}
          >
            <SelectTrigger className="h-7 text-[10px] xs:text-[10px] sm:text-xs px-2 py-0.5 border-0 shadow-none bg-transparent hover:bg-accent/50 focus:ring-0 focus:ring-offset-0 [&>span]:text-muted-foreground [&>span]:leading-tight">
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
        data-testid="button-close-dialog-panel"
        className="h-7 w-7 xs:h-8 xs:w-8 sm:h-9 sm:w-9 flex-shrink-0"
      >
        <X className="w-3.5 xs:w-4 h-3.5 xs:h-4" />
      </Button>
    </div>
  );
}

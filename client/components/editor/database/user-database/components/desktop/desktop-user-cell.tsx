/**
 * @fileoverview Компонент ячейки пользователя в таблице
 * @description Отображает аватар, имя и ID пользователя
 */

import { TableCell } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserBotData } from '@shared/schema';

/**
 * Пропсы компонента DesktopUserCell
 */
interface DesktopUserCellProps {
  /** Данные пользователя */
  user: UserBotData;
  /** Функция форматирования имени */
  formatUserName: (user: UserBotData) => string;
}

/**
 * Генерирует инициалы из имени пользователя
 * @param user - Данные пользователя
 * @returns Строка с инициалами
 */
function getInitials(user: UserBotData): string {
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) {
    return firstName.slice(0, 2).toUpperCase();
  }
  return 'U';
}

/**
 * Компонент ячейки пользователя
 * @param props - Пропсы компонента
 * @returns JSX компонент ячейки
 */
export function DesktopUserCell({ user, formatUserName }: DesktopUserCellProps): React.JSX.Element {
  return (
    <TableCell className="py-2">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
            {getInitials(user)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{formatUserName(user)}</div>
          <div className="text-xs text-muted-foreground truncate">ID: {user.id}</div>
        </div>
      </div>
    </TableCell>
  );
}

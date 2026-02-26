/**
 * @fileoverview Компонент ячейки пользователя в таблице
 * @description Отображает имя и ID пользователя
 */

import { TableCell } from '@/components/ui/table';
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
 * Компонент ячейки пользователя
 * @param props - Пропсы компонента
 * @returns JSX компонент ячейки
 */
export function DesktopUserCell({ user, formatUserName }: DesktopUserCellProps): React.JSX.Element {
  return (
    <TableCell className="py-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{formatUserName(user)}</div>
          <div className="text-xs text-muted-foreground truncate">ID: {user.id}</div>
        </div>
      </div>
    </TableCell>
  );
}

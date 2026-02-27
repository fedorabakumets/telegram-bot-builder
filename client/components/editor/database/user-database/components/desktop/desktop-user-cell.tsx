/**
 * @fileoverview Компонент ячейки пользователя в таблице
 * @description Отображает аватар, имя и ID пользователя
 */

import { TableCell } from '@/components/ui/table';
import { UserBotData } from '@shared/schema';
import { UserAvatar } from '../../../dialog/components/user-avatar';

/**
 * Пропсы компонента DesktopUserCell
 */
interface DesktopUserCellProps {
  /** Данные пользователя */
  user: UserBotData;
  /** Функция форматирования имени */
  formatUserName: (user: UserBotData) => string;
  /** ID проекта */
  projectId: number;
}

/**
 * Компонент ячейки пользователя
 * @param props - Пропсы компонента
 * @returns JSX компонент ячейки
 */
export function DesktopUserCell({ user, formatUserName, projectId }: DesktopUserCellProps): React.JSX.Element {
  return (
    <TableCell className="py-2">
      <div className="flex items-center gap-3 min-w-0">
        <UserAvatar messageType="user" user={user} projectId={projectId} />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{formatUserName(user)}</div>
          <div className="text-xs text-muted-foreground truncate">ID: {user.id}</div>
        </div>
      </div>
    </TableCell>
  );
}

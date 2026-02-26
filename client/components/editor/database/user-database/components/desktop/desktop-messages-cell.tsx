/**
 * @fileoverview Компонент ячейки количества сообщений
 * @description Отображает число сообщений пользователя
 */

import { TableCell } from '@/components/ui/table';
import { UserBotData } from '@shared/schema';

/**
 * Пропсы компонента DesktopMessagesCell
 */
interface DesktopMessagesCellProps {
  /** Данные пользователя */
  user: UserBotData;
}

/**
 * Компонент ячейки количества сообщений
 * @param props - Пропсы компонента
 * @returns JSX компонент ячейки
 */
export function DesktopMessagesCell({ user }: DesktopMessagesCellProps): React.JSX.Element {
  return (
    <TableCell className="py-2 text-center">
      <span className="text-sm font-medium">{user.interactionCount || 0}</span>
    </TableCell>
  );
}

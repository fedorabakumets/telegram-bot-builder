/**
 * @fileoverview Компонент ячейки последнего сообщения
 * Отображает текст и время последнего сообщения пользователя
 */

import { TableCell } from '@/components/ui/table';
import { UserBotData } from '@shared/schema';
import { useLastMessage } from '../../hooks/queries/use-last-message';
import { formatRelativeTime } from '../../utils/format-relative-time';

/**
 * Пропсы компонента DesktopLastMessageCell
 */
interface DesktopLastMessageCellProps {
  /** Данные пользователя */
  user: UserBotData;
  /** ID проекта */
  projectId: number;
}

/**
 * Компонент ячейки последнего сообщения
 * @param props - Пропсы компонента
 * @returns JSX компонент ячейки
 */
export function DesktopLastMessageCell({ user, projectId }: DesktopLastMessageCellProps): React.JSX.Element {
  const { data: lastMessage } = useLastMessage(projectId, user.id);

  const messageText = lastMessage?.text || 'Нет сообщений';
  const timeAgo = formatRelativeTime(lastMessage?.createdAt || user.lastInteraction);

  return (
    <TableCell className="py-2 max-w-xs">
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="text-sm text-muted-foreground truncate">{messageText}</div>
        <div className="text-xs text-muted-foreground/70">{timeAgo}</div>
      </div>
    </TableCell>
  );
}

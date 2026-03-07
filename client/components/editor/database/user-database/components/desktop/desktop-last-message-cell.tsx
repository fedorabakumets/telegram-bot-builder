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
 * Получить иконку для типа медиа
 */
function getMediaIcon(type: string): string {
  switch (type) {
    case 'photo':
      return '📷';
    case 'video':
      return '🎬';
    case 'audio':
      return '🎵';
    case 'document':
      return '📄';
    case 'sticker':
      return ' sticker';
    default:
      return '📎';
  }
}

/**
 * Компонент ячейки последнего сообщения
 * @param props - Пропсы компонента
 * @returns JSX компонент ячейки
 */
export function DesktopLastMessageCell({ user, projectId }: DesktopLastMessageCellProps): React.JSX.Element {
  const { data: lastMessage } = useLastMessage(projectId, user.userId);

  // Получаем текст сообщения, обрабатывая null/undefined
  const rawText = lastMessage?.messageText;
  let messageText = (typeof rawText === 'string' && rawText.trim()) || '';

  // Если текста нет, но есть медиа, показываем иконку медиа
  if (!messageText && lastMessage?.media && lastMessage.media.length > 0) {
    const mediaTypes = [...new Set(lastMessage.media.map(m => m.fileType || m.type))];
    messageText = mediaTypes.map(type => getMediaIcon(type)).join(' ') + ' Медиафайл' + (mediaTypes.length > 1 ? 'ы' : '');
  }

  // Если всё ещё пусто, показываем заглушку
  if (!messageText) {
    messageText = 'Нет сообщений';
  }

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

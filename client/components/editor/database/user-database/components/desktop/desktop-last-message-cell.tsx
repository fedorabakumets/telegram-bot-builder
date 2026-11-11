/**
 * @fileoverview Компонент ячейки последнего сообщения
 * Отображает текст и время последнего сообщения пользователя.
 * Приоритет: поле lastMessageText из данных пользователя (JOIN на сервере),
 * затем — данные из useLastMessage (HTTP-запрос), затем — lastInteraction.
 */

import { TableCell } from '@/components/ui/table';
import { UserBotData } from '@shared/schema';
import { useLastMessage } from '../../hooks/queries/use-last-message';
import { useLiveLastMessage } from '../../hooks/queries/use-live-last-message';
import { formatDate } from '../../../dialog/utils/format-date';

/**
 * Расширенный тип пользователя с полями последнего сообщения из JOIN
 */
type UserBotDataWithLastMessage = UserBotData & {
  /** Текст последнего сообщения (из JOIN на сервере) */
  lastMessageText?: string | null;
  /** Время последнего сообщения (из JOIN на сервере) */
  lastMessageAt?: string | Date | null;
};

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
 * Получить подпись для типа медиа
 * @param type - Тип медиафайла
 * @returns Читаемая подпись вложения
 */
function getMediaLabel(type: string): string {
  switch (type) {
    case 'photo': return 'Фото';
    case 'video': return 'Видео';
    case 'audio': return 'Аудио';
    case 'document': return 'Документ';
    case 'sticker': return 'Стикер';
    default: return 'Вложение';
  }
}

/**
 * Маппинг текстовых плейсхолдеров на читаемую подпись
 */
const MEDIA_PLACEHOLDER_MAP: Record<string, string> = {
  '[Фото]': 'Фото',
  '[Photo]': 'Фото',
  '[Видео]': 'Видео',
  '[Аудио]': 'Аудио',
  '[Голосовое]': 'Голосовое',
  '[Документ]': 'Документ',
  '[Стикер]': 'Стикер',
  '[медиа]': 'Медиафайл',
};

/**
 * Компонент ячейки последнего сообщения пользователя.
 * Сначала показывает данные из JOIN (без запроса), затем обновляется через WS.
 * @param props - Пропсы компонента
 * @returns JSX компонент ячейки
 */
export function DesktopLastMessageCell({ user, projectId }: DesktopLastMessageCellProps): React.JSX.Element {
  const numericUserId = user.userId ? Number(user.userId) : 0;
  const userWithMsg = user as UserBotDataWithLastMessage;

  // Данные из JOIN — доступны сразу без HTTP-запроса.
  // undefined = поле не пришло (старые данные) → нужен HTTP-запрос
  // null = JOIN отработал, сообщений нет → запрос не нужен
  const needsFetch = userWithMsg.lastMessageText === undefined && userWithMsg.lastMessageAt === undefined;

  // HTTP-запрос только если JOIN-поля отсутствуют в объекте пользователя
  const { data: lastMessage } = useLastMessage(
    projectId,
    needsFetch ? numericUserId : undefined
  );

  // Подписка на real-time обновления через WebSocket
  useLiveLastMessage(projectId, numericUserId || null);

  // Определяем текст: WS-кэш → JOIN-данные → HTTP-данные → заглушка
  const rawText = lastMessage?.messageText ?? userWithMsg.lastMessageText;
  /** Стрипаем HTML-теги для превью — показываем чистый текст без разметки */
  const strippedText = typeof rawText === 'string'
    ? rawText.replace(/<[^>]*>/g, '').trim()
    : '';
  /** Заменяем текстовые плейсхолдеры медиа на читаемую подпись */
  let messageText = MEDIA_PLACEHOLDER_MAP[strippedText] ?? strippedText;

  if (!messageText && lastMessage?.media && lastMessage.media.length > 0) {
    const mediaTypes = [...new Set(lastMessage.media.map((m: any) => m.fileType ?? m.type ?? 'unknown'))];
    messageText = mediaTypes.map(getMediaLabel).join(', ');
  }

  if (!messageText) messageText = 'Нет сообщений';

  const timestampValue = lastMessage?.createdAt ?? userWithMsg.lastMessageAt ?? user.lastInteraction;
  const timestamp = timestampValue != null ? formatDate(timestampValue) : '';

  return (
    <TableCell className="py-2 max-w-xs">
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="text-sm text-muted-foreground truncate" title={messageText}>{messageText}</div>
        <div className="text-xs text-muted-foreground tabular-nums">{timestamp}</div>
      </div>
    </TableCell>
  );
}

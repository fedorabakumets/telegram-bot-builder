/**
 * @fileoverview Карточка одного диалога в левой колонке списка
 * @description Отображает аватар, имя, превью последнего сообщения и время
 */

import { UserBotData } from '@shared/schema';
import { UserAvatar } from '../../dialog/components/user-avatar';
import { formatRelativeTime } from '../utils/format-relative-time';
import { formatUserName } from '../utils';

/**
 * Маппинг текстовых плейсхолдеров медиа на читаемый вид с эмодзи
 */
const MEDIA_MAP: Record<string, string> = {
  '[Фото]': '📷 Фото',
  '[Photo]': '📷 Фото',
  '[Видео]': '🎬 Видео',
  '[Аудио]': '🎵 Аудио',
  '[Голосовое]': '🎤 Голосовое',
  '[Документ]': '📄 Документ',
  '[Стикер]': '🎭 Стикер',
  '[медиа]': '📎 Медиа',
};

/**
 * Расширенный тип пользователя с полями последнего сообщения
 */
type UserWithLastMessage = UserBotData & {
  /** Текст последнего сообщения из JOIN на сервере */
  lastMessageText?: string | null;
  /** Время последнего сообщения из JOIN на сервере */
  lastMessageAt?: string | Date | null;
};

/**
 * Форматирует превью сообщения: заменяет плейсхолдеры и стрипает HTML
 * @param raw - Сырой текст сообщения
 * @returns Отформатированный текст превью
 */
function formatPreview(raw: string | null | undefined): string {
  if (!raw) return 'Нет сообщений';
  const stripped = raw.replace(/<[^>]*>/g, '').trim();
  return MEDIA_MAP[stripped] ?? (stripped || 'Нет сообщений');
}

/**
 * Пропсы компонента DialogListItem
 */
interface DialogListItemProps {
  /** Данные пользователя */
  user: UserBotData;
  /** Флаг активного (выбранного) состояния */
  isSelected: boolean;
  /** Обработчик клика по карточке */
  onClick: () => void;
  /** ID проекта */
  projectId: number;
  /** ID токена для аватара */
  tokenId?: number | null;
}

/**
 * Карточка диалога в стиле мессенджера
 * @param props - Пропсы компонента
 * @returns JSX элемент карточки диалога
 */
export function DialogListItem({
  user,
  isSelected,
  onClick,
  projectId,
  tokenId,
}: DialogListItemProps): React.JSX.Element {
  const userWithMsg = user as UserWithLastMessage;
  const preview = formatPreview(userWithMsg.lastMessageText);
  const timestamp = formatRelativeTime(
    userWithMsg.lastMessageAt ?? user.lastInteraction
  );
  const name = formatUserName(user);

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full flex items-center gap-3 px-3 py-3 text-left',
        'transition-colors border-b border-border/30',
        'hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected ? 'bg-primary/10 hover:bg-primary/15' : '',
      ].join(' ')}
    >
      {/* Аватар пользователя */}
      <div className="flex-shrink-0">
        <UserAvatar
          messageType="user"
          user={user}
          projectId={projectId}
          tokenId={tokenId}
          size={40}
        />
      </div>

      {/* Основной контент карточки */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium truncate">{name}</span>
          <span className="text-xs text-muted-foreground flex-shrink-0">{timestamp}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{preview}</p>
      </div>
    </button>
  );
}

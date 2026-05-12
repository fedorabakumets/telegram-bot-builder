/**
 * @fileoverview Карточка одного диалога в левой колонке списка
 * @description Отображает аватар, имя, превью последнего сообщения и время.
 * Поддерживает как личные диалоги, так и групповые чаты.
 */

import { Users, Radio } from 'lucide-react';
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
 * Расширенный тип диалога с полями последнего сообщения и флагом группы
 */
type DialogWithMeta = UserBotData & {
  /** Текст последнего сообщения из JOIN на сервере */
  lastMessageText?: string | null;
  /** Время последнего сообщения из JOIN на сервере */
  lastMessageAt?: string | Date | null;
  /** Флаг группового диалога */
  isGroup?: boolean;
  /** Тип чата для групп */
  chatType?: string;
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
 * Возвращает читаемый тип чата для бейджа
 * @param chatType - Тип чата из Telegram
 * @returns Строка для отображения
 */
function formatChatType(chatType?: string): string {
  switch (chatType) {
    case 'channel': return 'Канал';
    case 'supergroup': return 'Супергруппа';
    default: return 'Группа';
  }
}

/**
 * Пропсы компонента DialogListItem
 */
interface DialogListItemProps {
  /** Данные пользователя или группы */
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
 * Карточка диалога в стиле мессенджера.
 * Для групп показывает иконку группы/канала и бейдж типа чата.
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
  const entry = user as DialogWithMeta;
  const preview = formatPreview(entry.lastMessageText);
  const timestamp = formatRelativeTime(entry.lastMessageAt ?? user.lastInteraction);
  const name = entry.isGroup ? (user.firstName ?? 'Группа') : formatUserName(user);
  const isChannel = entry.chatType === 'channel';

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
      {/* Аватар: для групп — иконка, для пользователей — фото */}
      <div className="flex-shrink-0">
        {entry.isGroup ? (
          <div
            style={{ width: 40, height: 40 }}
            className={[
              'rounded-full flex items-center justify-center',
              isChannel
                ? 'bg-rose-100 dark:bg-rose-900'
                : 'bg-violet-100 dark:bg-violet-900',
            ].join(' ')}
          >
            {isChannel ? (
              <Radio
                style={{ width: 20, height: 20 }}
                className="text-rose-600 dark:text-rose-400"
              />
            ) : (
              <Users
                style={{ width: 20, height: 20 }}
                className="text-violet-600 dark:text-violet-400"
              />
            )}
          </div>
        ) : (
          <UserAvatar
            messageType="user"
            user={user}
            projectId={projectId}
            tokenId={tokenId}
            size={40}
          />
        )}
      </div>

      {/* Основной контент карточки */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-medium truncate">{name}</span>
            {entry.isGroup && (
              <span
                className={[
                  'text-[10px] px-1 py-0.5 rounded font-medium flex-shrink-0',
                  isChannel
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
                    : 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
                ].join(' ')}
              >
                {formatChatType(entry.chatType)}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground flex-shrink-0">{timestamp}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{preview}</p>
      </div>
    </button>
  );
}

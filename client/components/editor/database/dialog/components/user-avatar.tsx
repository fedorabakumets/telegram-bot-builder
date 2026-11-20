/**
 * @fileoverview Компонент аватара пользователя
 * Отображает фото пользователя или иконку по умолчанию.
 * Для бота — тот же прокси, что на вкладке «Бот»: /users/bot/avatar?tokenId=…
 * Для пользователя — /users/:userId/avatar; сервер сам подтянет фото из Telegram если в БД пусто.
 * Кэширует неудачные URL в sessionStorage (общий с BotAvatar).
 */

import { Bot, User, ZoomIn } from 'lucide-react';
import type { UserBotData } from '@/types/bot';
import { useState } from 'react';
import { isAvatarUrlFailed, markAvatarUrlFailed } from '@/lib/avatar-failed-cache';

/** Свойства аватара */
interface UserAvatarProps {
  /** Тип сообщения: bot или user */
  messageType: 'bot' | 'user';
  /** Данные пользователя */
  user?: Pick<UserBotData, 'userId'> | null;
  /** ID проекта для прокси */
  projectId?: number;
  /** ID токена для резолва file_id аватара */
  tokenId?: number | null;
  /** Размер в пикселях */
  size?: number;
  /** Открывает доступную фотографию в просмотрщике профиля. */
  onPhotoClick?: (src: string) => void;
}

/**
 * Строит URL аватара пользователя с опциональным tokenId
 * @param projectId - ID проекта
 * @param userId - ID пользователя
 * @param tokenId - ID токена (опционально)
 * @returns URL аватара
 */
function buildUserAvatarUrl(projectId: number, userId: string | number, tokenId?: number | null): string {
  const base = `/api/projects/${projectId}/users/${userId}/avatar`;
  return tokenId ? `${base}?tokenId=${tokenId}` : base;
}

/**
 * Строит URL аватара бота (как BotAvatar на вкладке «Бот»)
 * @param projectId - ID проекта
 * @param tokenId - ID токена (опционально)
 * @returns URL аватара бота
 */
function buildBotAvatarUrl(projectId: number, tokenId?: number | null): string {
  const base = `/api/projects/${projectId}/users/bot/avatar`;
  return tokenId ? `${base}?tokenId=${tokenId}` : base;
}

/**
 * Компонент аватара с поддержкой реальных фото.
 * Бот: /users/bot/avatar?tokenId= — не зависит от bot/data и userId.
 * Пользователь: /users/:userId/avatar. При ошибке показывает иконку.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function UserAvatar({ messageType, user, projectId, tokenId, size = 28, onPhotoClick }: UserAvatarProps) {
  const isBot = messageType === 'bot';
  /** Для групп (отрицательный userId) аватарку через этот роут не запрашиваем */
  const isGroupChat = user?.userId ? String(user.userId).startsWith('-') : false;
  const iconSize = size * 0.5;

  const photoUrl = isBot
    ? (projectId ? buildBotAvatarUrl(projectId, tokenId) : null)
    : (projectId && user?.userId && !isGroupChat
      ? buildUserAvatarUrl(projectId, user.userId, tokenId)
      : null);

  /** Ошибка относится только к конкретному адресу и не блокирует фото при смене бота. */
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  /** До завершения загрузки сохраняет видимую иконку вместо пустого места. */
  const [loadedPhotoUrl, setLoadedPhotoUrl] = useState<string | null>(null);
  const canFetchPhoto = !!photoUrl && failedPhotoUrl !== photoUrl && !isAvatarUrlFailed(photoUrl);
  const placeholder = <div style={{ width: size, height: size }} className={`flex-shrink-0 rounded-full flex items-center justify-center ${isBot ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900'}`}>
    {isBot ? <Bot style={{ width: iconSize, height: iconSize }} className="text-blue-600 dark:text-blue-400" />
      : <User style={{ width: iconSize, height: iconSize }} className="text-green-600 dark:text-green-400" />}
  </div>;

  if (canFetchPhoto && photoUrl) {
    const image = (
      <img
        loading="lazy"
        src={photoUrl}
        alt={isBot ? 'Bot avatar' : 'User avatar'}
        style={{ width: size, height: size }}
        className="absolute inset-0 flex-shrink-0 rounded-full object-cover"
        onLoad={() => setLoadedPhotoUrl(photoUrl)}
        onError={() => {
          markAvatarUrlFailed(photoUrl);
          setFailedPhotoUrl(photoUrl);
        }}
      />
    );
    if (!onPhotoClick) return <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      {loadedPhotoUrl !== photoUrl && placeholder}{image}
    </span>;
    return (
      <button type="button" onClick={() => onPhotoClick(photoUrl)} aria-label="Увеличить фотографию пользователя"
        style={{ width: size, height: size }}
        className="group relative shrink-0 overflow-hidden rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {loadedPhotoUrl !== photoUrl && placeholder}{image}
        <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <ZoomIn className="h-6 w-6" />
        </span>
      </button>
    );
  }

  return placeholder;
}

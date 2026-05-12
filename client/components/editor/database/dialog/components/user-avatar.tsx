/**
 * @fileoverview Компонент аватара пользователя
 * Отображает фото пользователя или иконку по умолчанию.
 * Запрашивает аватарку через прокси всегда когда есть projectId и userId —
 * сервер сам получит её из Telegram если в БД пусто.
 */

import { Bot, User } from 'lucide-react';
import { UserBotData } from '@shared/schema';
import { useState } from 'react';

/** Свойства аватара */
interface UserAvatarProps {
  /** Тип сообщения: bot или user */
  messageType: 'bot' | 'user';
  /** Данные пользователя */
  user?: UserBotData | null;
  /** ID проекта для прокси */
  projectId?: number;
  /** ID токена для резолва file_id аватара */
  tokenId?: number | null;
  /** Размер в пикселях */
  size?: number;
}

/**
 * Строит URL аватара с опциональным tokenId
 * @param projectId - ID проекта
 * @param userId - ID пользователя
 * @param tokenId - ID токена (опционально)
 * @returns URL аватара
 */
function buildAvatarUrl(projectId: number, userId: string | number, tokenId?: number | null): string {
  const base = `/api/projects/${projectId}/users/${userId}/avatar`;
  return tokenId ? `${base}?tokenId=${tokenId}` : base;
}

/**
 * Компонент аватара с поддержкой реальных фото.
 * Запрашивает аватарку через прокси независимо от наличия avatarUrl в объекте пользователя —
 * сервер получит её из Telegram если в БД пусто. При ошибке показывает иконку.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function UserAvatar({ messageType, user, projectId, tokenId, size = 28 }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const isBot = messageType === 'bot';
  /** Для групп (отрицательный userId) аватарку через этот роут не запрашиваем */
  const isGroupChat = user?.userId ? String(user.userId).startsWith('-') : false;
  /** Показываем img если есть projectId и userId — avatarUrl в БД не обязателен */
  const canFetchPhoto = !!projectId && !!user?.userId && !imageError && !isGroupChat;
  const iconSize = size * 0.5;

  if (isBot && canFetchPhoto && user?.userId) {
    return (
      <img
        src={buildAvatarUrl(projectId!, user.userId, tokenId)}
        alt="Bot avatar"
        style={{ width: size, height: size }}
        className="flex-shrink-0 rounded-full object-cover"
        onError={() => setImageError(true)}
      />
    );
  }

  if (isBot) {
    return (
      <div style={{ width: size, height: size }} className="flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
        <Bot style={{ width: iconSize, height: iconSize }} className="text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  if (canFetchPhoto && user?.userId) {
    return (
      <img
        src={buildAvatarUrl(projectId!, user.userId, tokenId)}
        alt="User avatar"
        style={{ width: size, height: size }}
        className="flex-shrink-0 rounded-full object-cover"
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div style={{ width: size, height: size }} className="flex-shrink-0 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
      <User style={{ width: iconSize, height: iconSize }} className="text-green-600 dark:text-green-400" />
    </div>
  );
}

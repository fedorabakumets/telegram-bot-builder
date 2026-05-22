/**
 * @fileoverview Компонент аватарки бота
 *
 * Отображает аватарку бота через серверный прокси с передачей tokenId.
 * Кеширует неудачные загрузки (404) на уровне модуля чтобы не мигать сломанным img.
 * Fallback — инициалы или иконка бота.
 *
 * @module BotAvatar
 */

import { useState } from 'react';

/** Глобальный кеш URL-ов, для которых загрузка завершилась ошибкой */
const failedUrlCache = new Set<string>();

/**
 * Свойства аватарки бота
 */
interface BotAvatarProps {
  /** Наличие фото (true = есть фото, null/undefined = нет) */
  photoUrl?: string | null | boolean;
  /** Имя бота (для инициалов) */
  botName: string;
  /** Размер в пикселях */
  size?: number;
  /** Дополнительный CSS-класс */
  className?: string;
  /** ID проекта для прокси аватарки */
  projectId?: number;
  /** ID токена бота — передаётся в запрос чтобы сервер использовал правильный токен */
  tokenId?: number;
  /** ID бота (не используется, оставлен для совместимости) */
  botId?: string;
}

/**
 * Аватарка бота — загружает через серверный прокси /api/projects/:id/users/bot/avatar?tokenId=:tokenId
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotAvatar({ photoUrl, botName, size = 40, className = '', projectId, tokenId }: BotAvatarProps) {
  /** URL прокси аватарки */
  const hasPhoto = !!photoUrl && !!projectId;
  const proxyUrl = hasPhoto
    ? `/api/projects/${projectId}/users/bot/avatar${tokenId ? `?tokenId=${tokenId}` : ''}`
    : null;

  /** Локальный флаг ошибки — для ре-рендера при onError */
  const [imgError, setImgError] = useState(() => !!proxyUrl && failedUrlCache.has(proxyUrl));

  /** Показываем img только если URL есть и не в кеше ошибок */
  const showImg = proxyUrl && !failedUrlCache.has(proxyUrl) && !imgError;

  if (showImg) {
    return (
      <div
        className={`relative rounded-full overflow-hidden flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={proxyUrl}
          alt={`${botName} avatar`}
          className="w-full h-full object-cover"
          onError={() => {
            failedUrlCache.add(proxyUrl);
            setImgError(true);
          }}
        />
      </div>
    );
  }

  // Fallback: инициалы или иконка
  const initials = botName.split(' ').map(w => w.charAt(0)).join('').toUpperCase().slice(0, 2);

  return (
    <div
      className={`bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {initials ? (
        <span className="text-white font-semibold" style={{ fontSize: size * 0.4 }}>{initials}</span>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="text-white" aria-hidden="true">
          <path d="M12 8V4H8" />
          <rect width="16" height="12" x="4" y="8" rx="2" />
          <path d="M2 14h2" /><path d="M20 14h2" />
          <path d="M15 13v2" /><path d="M9 13v2" />
        </svg>
      )}
    </div>
  );
}

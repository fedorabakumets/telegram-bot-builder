/**
 * @fileoverview Компонент аватарки бота
 *
 * Отображает аватарку бота через серверный прокси с передачей tokenId.
 * Неудачные URL кэширует в sessionStorage (общий модуль с UserAvatar).
 * Fallback — инициалы или иконка бота.
 *
 * @module BotAvatar
 */

import { useState } from 'react';
import { isAvatarUrlFailed, markAvatarUrlFailed } from '@/lib/avatar-failed-cache';

/** Свойства аватарки бота */
interface BotAvatarProps {
  /** Наличие фото (true = есть фото, null/undefined = нет) */
  photoUrl?: string | null | boolean;
  /** Имя бота (для инициалов) */
  botName: string;
  /** Размер в пикселях */
  size?: number;
  /** Дополнительный CSS-класс */
  className?: string;
  /** Вариант оформления: круглый профиль или плитка сервиса */
  variant?: 'profile' | 'service';
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
export function BotAvatar({
  photoUrl,
  botName,
  size = 40,
  className = '',
  variant = 'profile',
  projectId,
  tokenId,
}: BotAvatarProps) {
  /** URL прокси аватарки */
  const hasPhoto = !!photoUrl && !!projectId;
  const proxyUrl = hasPhoto
    ? `/api/projects/${projectId}/users/bot/avatar${tokenId ? `?tokenId=${tokenId}` : ''}`
    : null;

  /** Локальный флаг ошибки — для ре-рендера при onError */
  const [imgError, setImgError] = useState(() => !!proxyUrl && isAvatarUrlFailed(proxyUrl));

  /** Показываем img только если URL есть и не в кеше ошибок */
  const showImg = proxyUrl && !isAvatarUrlFailed(proxyUrl) && !imgError;

  if (showImg) {
    return (
      <div
        className={[
          'relative overflow-hidden flex-shrink-0',
          variant === 'service'
            ? 'rounded-lg border border-blue-400/35 bg-blue-950 shadow-sm shadow-blue-500/10'
            : 'rounded-full',
          className,
        ].join(' ')}
        style={{ width: size, height: size }}
      >
        <img
          src={proxyUrl}
          alt={`${botName} avatar`}
          className="w-full h-full object-cover"
          onError={() => {
            markAvatarUrlFailed(proxyUrl);
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
      className={[
        'flex items-center justify-center flex-shrink-0',
        variant === 'service'
          ? [
              'rounded-lg border border-blue-400/40 text-white',
              'bg-gradient-to-br from-blue-600 to-blue-500',
              'shadow-sm shadow-blue-500/20',
              'dark:border-blue-400/30 dark:from-slate-950 dark:via-blue-950 dark:to-blue-900',
              'dark:text-blue-100 dark:shadow-blue-950/40',
            ].join(' ')
          : 'rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white dark:from-blue-600 dark:to-indigo-700',
        className,
      ].join(' ')}
      style={{ width: size, height: size }}
    >
      {initials ? (
        <span
          className={variant === 'service' ? 'font-semibold tracking-tight' : 'font-semibold text-white'}
          style={{ fontSize: size * (variant === 'service' ? 0.34 : 0.4) }}
        >
          {initials}
        </span>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={variant === 'service' ? 'text-muted-foreground' : 'text-white'} aria-hidden="true">
          <path d="M12 8V4H8" />
          <rect width="16" height="12" x="4" y="8" rx="2" />
          <path d="M2 14h2" /><path d="M20 14h2" />
          <path d="M15 13v2" /><path d="M9 13v2" />
        </svg>
      )}
    </div>
  );
}

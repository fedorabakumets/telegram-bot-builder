/**
 * @fileoverview Компонент аватарки бота
 *
 * Отображает аватарку бота с несколькими стратегиями:
 * 1. Если есть projectId и botId — загружает через UserAvatar (с кэшем staleTime=60s)
 * 2. Если есть photoUrl — показывает изображение напрямую
 * 3. Fallback — инициалы или иконка бота
 *
 * @module BotAvatar
 */

import { useMemo } from 'react';
import { UserAvatar } from '../../database/dialog/components/user-avatar';
import { useBotData } from '../../database/dialog/hooks/use-bot-data';
import type { UserBotData } from '@shared/schema';

/**
 * Свойства аватарки бота
 */
interface BotAvatarProps {
  /** URL фото профиля */
  photoUrl?: string | null;
  /** Имя бота (для инициалов) */
  botName: string;
  /** Telegram userId бота */
  botUserId?: string;
  /** Telegram ID бота (альтернатива botUserId) */
  botId?: string | null;
  /** Размер в пикселях */
  size?: number;
  /** Дополнительный CSS-класс */
  className?: string;
  /** ID проекта для загрузки аватарки через API */
  projectId?: number;
}

/**
 * Аватарка бота с fallback
 */
export function BotAvatar({
  photoUrl,
  botName,
  botUserId,
  botId,
  size = 40,
  className = '',
  projectId,
}: BotAvatarProps) {
  // Загружаем данные бота только если есть projectId (staleTime=60s задан в useBotData)
  const { bot: botData } = useBotData(projectId || 0);

  const resolvedUserId = botUserId || botId || botData?.userId;
  const resolvedPhotoUrl = photoUrl || botData?.avatarUrl;

  // Формируем объект UserBotData для UserAvatar
  const botUser = useMemo((): UserBotData | null => {
    if (!resolvedPhotoUrl && !resolvedUserId) return null;
    return {
      avatarUrl: resolvedPhotoUrl || undefined,
      userId: resolvedUserId,
      userName: botName,
      firstName: botName,
      lastName: null,
      userData: null,
      isActive: true,
      isPremium: false,
      isBlocked: false,
      isBot: true,
      registeredAt: null,
      createdAt: null,
      lastInteraction: null,
      interactionCount: 0,
    } as UserBotData;
  }, [resolvedPhotoUrl, resolvedUserId, botName]);

  // Если есть projectId и userId — используем UserAvatar
  if (projectId && resolvedUserId && botUser) {
    return (
      <div className={`flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
        <UserAvatar
          messageType="bot"
          user={botUser}
          projectId={projectId}
          size={size}
        />
      </div>
    );
  }

  // Fallback: прямое изображение
  if (resolvedPhotoUrl) {
    return (
      <div
        className={`relative rounded-lg overflow-hidden flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={resolvedPhotoUrl}
          alt={`${botName} avatar`}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Fallback: инициалы или иконка
  const initials = botName
    .split(' ')
    .map(w => w.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-lg flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {initials ? (
        <span className="text-white font-semibold" style={{ fontSize: size * 0.4 }}>
          {initials}
        </span>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size * 0.5}
          height={size * 0.5}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
          aria-hidden="true"
        >
          <path d="M12 8V4H8" />
          <rect width="16" height="12" x="4" y="8" rx="2" />
          <path d="M2 14h2" />
          <path d="M20 14h2" />
          <path d="M15 13v2" />
          <path d="M9 13v2" />
        </svg>
      )}
    </div>
  );
}

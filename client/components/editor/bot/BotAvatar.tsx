/**
 * @fileoverview Компонент аватарки бота
 *
 * Использует компонент UserAvatar из диалоговой панели для консистентности.
 *
 * @module BotAvatar
 */

import { useMemo } from 'react';
import { UserAvatar } from '../database/dialog/components/user-avatar';
import { useBotData } from '../database/dialog/hooks/use-bot-data';

interface BotAvatarProps {
  photoUrl?: string | null;
  botName: string;
  botUserId?: string;
  botId?: string | null;
  size?: number;
  className?: string;
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
  className = "",
  projectId
}: BotAvatarProps) {
  // Загружаем данные бота из API для получения актуальной аватарки
  const { bot: botData } = useBotData(projectId || 0);
  
  // Используем botUserId или botId или загружаем из API
  const extractedBotUserId = botUserId || botId || botData?.userId;
  const extractedPhotoUrl = photoUrl || botData?.avatarUrl;

  // Создаём стабильный объект user в формате UserBotData для совместимости с UserAvatar
  // Используем useMemo для предотвращения пересоздания при каждом рендере
  const botUser = useMemo(() => {
    if (!extractedPhotoUrl && !extractedBotUserId) return null;
    
    return {
      avatarUrl: extractedPhotoUrl || undefined,
      userId: extractedBotUserId,
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
      interactionCount: 0
    } as any;
  }, [extractedPhotoUrl, extractedBotUserId, botName]);

  // Если есть projectId и botUserId, используем UserAvatar для загрузки аватарки из API
  if (projectId && extractedBotUserId && botUser) {
    return (
      <UserAvatar
        messageType="bot"
        user={botUser}
        projectId={projectId}
        size={size}
      />
    );
  }

  // Fallback на старый стиль отображения
  const initials = botName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const showImage = photoUrl && !extractedBotUserId;

  if (showImage) {
    return (
      <div
        className={`relative rounded-lg overflow-hidden flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={photoUrl}
          alt={`${botName} avatar`}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-lg flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {initials ? (
        <span
          className="text-white font-semibold"
          style={{ fontSize: size * 0.4 }}
        >
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

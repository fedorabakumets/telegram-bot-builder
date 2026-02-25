/**
 * @fileoverview Компонент аватарки бота
 *
 * Отображает аватарку бота с fallback на инициалы или иконку.
 *
 * @module BotAvatar
 */

import { useState } from 'react';
import { Bot } from 'lucide-react';

interface BotAvatarProps {
  photoUrl?: string | null;
  botName: string;
  size?: number;
  className?: string;
}

/**
 * Аватарка бота с fallback
 */
export function BotAvatar({
  photoUrl,
  botName,
  size = 40,
  className = ""
}: BotAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const initials = botName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleImageError = () => {
    setImageError(true);
  };

  const showImage = photoUrl && !imageError;

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
          onError={handleImageError}
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
        <Bot
          className="text-white"
          size={size * 0.5}
        />
      )}
    </div>
  );
}

/**
 * @fileoverview Компонент аватарки бота
 *
 * Отображает аватарку бота напрямую по URL без прокси.
 * Fallback — инициалы или иконка бота.
 *
 * @module BotAvatar
 */

import { useRef } from 'react';
import { useBotData } from '../../database/dialog/hooks/use-bot-data';

/**
 * Свойства аватарки бота
 */
interface BotAvatarProps {
  /** URL фото профиля */
  photoUrl?: string | null;
  /** Имя бота (для инициалов) */
  botName: string;
  /** Размер в пикселях */
  size?: number;
  /** Дополнительный CSS-класс */
  className?: string;
  /** ID проекта для загрузки аватарки через API */
  projectId?: number;
}

/**
 * Аватарка бота — показывает фото напрямую по URL, без прокси
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotAvatar({ photoUrl, botName, size = 40, className = '', projectId }: BotAvatarProps) {
  const { bot: botData } = useBotData(projectId || 0);

  const rawPhotoUrl = photoUrl;  // Используем только явно переданный URL, без фоллбэка на данные проекта

  // Стабилизируем — не сбрасываем в null если уже было значение (защита от мигания при рефетче)
  const stableRef = useRef<string | null | undefined>(undefined);
  if (rawPhotoUrl) stableRef.current = rawPhotoUrl;
  const resolvedPhotoUrl = rawPhotoUrl || stableRef.current;

  if (resolvedPhotoUrl) {
    return (
      <div
        className={`relative rounded-full overflow-hidden flex-shrink-0 ${className}`}
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

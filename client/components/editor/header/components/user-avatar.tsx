/**
 * @fileoverview Аватар пользователя
 * @description Отображает фотографию профиля пользователя с кольцом
 */

/**
 * Свойства компонента аватара
 */
export interface UserAvatarProps {
  /** URL фотографии пользователя */
  photoUrl?: string | null;
  /** Дополнительные CSS-классы */
  className?: string;
}

/**
 * Аватар пользователя с фотографией и декоративным кольцом
 */
export function UserAvatar({ photoUrl, className }: UserAvatarProps) {
  if (!photoUrl) return null;

  return (
    <img
      src={photoUrl}
      alt="Avatar"
      className={`w-7 h-7 rounded-full ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20 ${className || ''}`}
    />
  );
}

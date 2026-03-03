/**
 * @fileoverview Информация о пользователе
 * @description Отображает имя и username пользователя
 */

/**
 * Свойства компонента информации о пользователе
 */
export interface UserInfoProps {
  /** Имя пользователя */
  firstName: string;
  /** Username пользователя (опционально) */
  username?: string | null;
  /** Вертикальное расположение */
  isVertical?: boolean;
}

/**
 * Информация о пользователе: имя и username
 */
export function UserInfo({ firstName, username, isVertical }: UserInfoProps) {
  if (isVertical) return null;

  return (
    <div className="text-right hidden sm:block">
      <p className="text-xs font-bold text-foreground">{firstName}</p>
      {username && (
        <p className="text-xs text-blue-600 dark:text-blue-300">@{username}</p>
      )}
    </div>
  );
}

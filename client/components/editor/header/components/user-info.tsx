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
 * Короткое имя в шапке. Полный username остаётся в подсказке.
 * @param props - Имя и username
 * @returns Одна строка с именем или null в вертикальной шапке
 */
export function UserInfo({ firstName, username, isVertical }: UserInfoProps) {
  if (isVertical) return null;

  const handle = username ? `@${username.replace(/^@/, "")}` : "";
  const title = handle ? `${firstName} ${handle}` : firstName;

  return (
    <p className="hidden max-w-[5.5rem] truncate text-xs font-bold text-foreground xl:block" title={title}>
      {firstName}
    </p>
  );
}

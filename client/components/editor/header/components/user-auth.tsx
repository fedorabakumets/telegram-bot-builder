/**
 * @fileoverview Авторизация пользователя
 * @description Компонент отображает секцию пользователя или кнопку входа
 */

import { UserSection, type TelegramUser } from './user-section';

/**
 * Свойства компонента авторизации
 */
export interface UserAuthProps {
  /** Данные авторизованного пользователя (null если не авторизован) */
  user: TelegramUser | null;
  /** Обработчик выхода */
  onLogout?: () => void;
  /** Обработчик входа */
  onLogin?: () => void;
  /** Вертикальное расположение */
  isVertical?: boolean;
}

/**
 * Компонент авторизации: показывает секцию пользователя или кнопку входа
 */
export function UserAuth({ user, onLogout, isVertical }: UserAuthProps) {
  if (user) {
    return <UserSection user={user} onLogout={onLogout || (() => {})} isVertical={isVertical} />;
  }

  // Временно скрыта кнопка входа
  // return <LoginButton onClick={onLogin} />;
  return null;
}

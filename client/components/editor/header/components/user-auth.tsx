/**
 * @fileoverview Авторизация пользователя
 * @description Отображает секцию пользователя, гостя или ничего при загрузке
 */

import { UserSection } from './user-section';
import { GuestSection } from './guest-section';
import { isGuest, isTelegramUser } from '@/types/telegram-user';
import type { AppUser } from '@/types/telegram-user';

/**
 * Свойства компонента авторизации
 */
export interface UserAuthProps {
  /** Пользователь приложения (Telegram, гость или null) */
  user: AppUser | null;
  /** Флаг загрузки — при true ничего не рендерится */
  isLoading?: boolean;
  /** Обработчик выхода */
  onLogout?: () => void;
  /** Обработчик входа */
  onLogin?: () => void;
  /** Вертикальное расположение */
  isVertical?: boolean;
}

/**
 * Компонент авторизации: загрузка → null, Telegram → UserSection, гость → GuestSection
 * @param props - Свойства компонента
 * @returns JSX элемент или null
 */
export function UserAuth({ user, isLoading, onLogout, onLogin, isVertical }: UserAuthProps) {
  if (isLoading) return null;

  if (user && isTelegramUser(user)) {
    return <UserSection user={user} onLogout={onLogout || (() => {})} isVertical={isVertical} />;
  }

  if (user && isGuest(user)) {
    return <GuestSection onLogin={onLogin} isVertical={isVertical} />;
  }

  return null;
}

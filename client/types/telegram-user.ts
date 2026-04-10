/**
 * @fileoverview Единый тип пользователя приложения (Telegram или гость)
 * @module types/telegram-user
 */

/**
 * Данные пользователя, полученные от Telegram
 */
export interface TelegramUser {
  /** Уникальный идентификатор пользователя */
  id: number;
  /** Имя пользователя */
  firstName: string;
  /** Фамилия пользователя (опционально) */
  lastName?: string;
  /** Username в Telegram (опционально) */
  username?: string;
  /** URL фотографии профиля (опционально) */
  photoUrl?: string | null;
}

/**
 * Гостевой пользователь — не авторизован через Telegram
 */
export interface GuestUser {
  /** Признак гостевого режима */
  isGuest: true;
}

/**
 * Объединённый тип пользователя приложения
 */
export type AppUser = TelegramUser | GuestUser;

/**
 * Проверяет, является ли пользователь гостем
 * @param user - Пользователь приложения
 * @returns true если гость
 */
export function isGuest(user: AppUser): user is GuestUser {
  return (user as GuestUser).isGuest === true;
}

/**
 * Проверяет, является ли пользователь авторизованным через Telegram
 * @param user - Пользователь приложения
 * @returns true если авторизован через Telegram
 */
export function isTelegramUser(user: AppUser): user is TelegramUser {
  return !isGuest(user);
}

/**
 * @fileoverview Единый тип пользователя Telegram
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

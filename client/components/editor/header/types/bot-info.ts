/**
 * @fileoverview Информация о Telegram-боте
 * @description Содержит основные данные о боте: имя, username, описание
 */

/**
 * Информация о боте
 */
export interface BotInfo {
  /** Имя бота */
  first_name: string;
  /** Имя пользователя бота (username) */
  username?: string;
  /** Полное описание бота */
  description?: string;
  /** Краткое описание бота */
  short_description?: string;
}

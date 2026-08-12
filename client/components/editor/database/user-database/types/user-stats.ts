/**
 * @fileoverview Тип статистики пользователей бота
 */

/**
 * Статистика пользователей бота
 */
export interface UserStats {
  /** Общее количество зарегистрированных пользователей в боте */
  totalUsers?: number;

  /** Количество активных пользователей (is_active = 1) */
  activeUsers?: number;

  /** Количество неактивных по is_active = 0 (legacy) */
  blockedUsers?: number;

  /** Заблокировали бота (is_blocked = 1) — не входят в рассылки */
  blockedBotUsers?: number;

  /** Аккаунт удалён (is_deleted = 1) — не входят в рассылки */
  deletedUsers?: number;

  /** Количество premium-пользователей (Telegram Premium) */
  premiumUsers?: number;

  /** Общее количество всех взаимодействий (сообщений от всех пользователей) */
  totalInteractions?: number;

  /** Среднее количество взаимодействий на одного пользователя */
  avgInteractionsPerUser?: number;

  /** Количество пользователей, предоставивших ответы на вопросы бота */
  usersWithResponses?: number;

  /** Количество уникальных языков пользователей */
  uniqueLanguages?: number;

  /** Количество пользователей пришедших по deep link (не direct) */
  deepLinkUsers?: number;

  /** Количество пользователей пришедших по реферальной ссылке */
  referralUsers?: number;
}

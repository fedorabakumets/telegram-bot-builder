/**
 * Статистика пользователей бота
 */
export interface UserStats {
  /** Общее количество зарегистрированных пользователей в боте */
  totalUsers?: number;

  /** Количество активных пользователей (незаблокированных) */
  activeUsers?: number;

  /** Количество заблокированных пользователей */
  blockedUsers?: number;

  /** Количество premium-пользователей (Telegram Premium) */
  premiumUsers?: number;

  /** Общее количество всех взаимодействий (сообщений от всех пользователей) */
  totalInteractions?: number;

  /** Среднее количество взаимодействий на одного пользователя */
  avgInteractionsPerUser?: number;

  /** Количество пользователей, предоставивших ответы на вопросы бота */
  usersWithResponses?: number;
}

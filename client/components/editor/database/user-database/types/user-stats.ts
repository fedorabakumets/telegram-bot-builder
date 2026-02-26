/**
 * @fileoverview Типы статистики пользователей
 * @description Интерфейс для хранения статистики взаимодействия пользователей с ботом
 */

/**
 * Статистика пользователей
 * @interface
 */
export interface UserStats {
  /** Общее количество пользователей */
  totalUsers?: number;
  /** Количество активных пользователей */
  activeUsers?: number;
  /** Количество заблокированных пользователей */
  blockedUsers?: number;
  /** Количество premium пользователей */
  premiumUsers?: number;
  /** Общее количество взаимодействий */
  totalInteractions?: number;
  /** Среднее количество взаимодействий на пользователя */
  avgInteractionsPerUser?: number;
  /** Количество пользователей с ответами */
  usersWithResponses?: number;
}

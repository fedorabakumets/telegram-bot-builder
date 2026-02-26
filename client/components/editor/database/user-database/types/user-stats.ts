/**
 * @fileoverview Типы статистики пользователей
 * @description Интерфейс для хранения и отображения статистики взаимодействия пользователей с ботом
 * @module
 */

/**
 * Статистика пользователей бота
 * @interface UserStats
 * @description Содержит агрегированные данные для отображения в карточках статистики компонента UserDatabasePanel
 */
export interface UserStats {
  /**
   * Общее количество зарегистрированных пользователей в боте
   * @type {number}
   * @optional
   */
  totalUsers?: number;

  /**
   * Количество активных пользователей (незаблокированных, могут взаимодействовать с ботом)
   * @type {number}
   * @optional
   */
  activeUsers?: number;

  /**
   * Количество заблокированных пользователей (не могут использовать бота)
   * @type {number}
   * @optional
   */
  blockedUsers?: number;

  /**
   * Количество premium-пользователей (Telegram Premium)
   * @type {number}
   * @optional
   */
  premiumUsers?: number;

  /**
   * Общее количество всех взаимодействий (сообщений от всех пользователей)
   * @type {number}
   * @optional
   */
  totalInteractions?: number;

  /**
   * Среднее количество взаимодействий на одного пользователя
   * @type {number}
   * @optional
   * @description Вычисляется как totalInteractions / totalUsers
   */
  avgInteractionsPerUser?: number;

  /**
   * Количество пользователей, предоставивших ответы на вопросы бота
   * @type {number}
   * @optional
   * @description Пользователи, у которых есть заполненные userData (ответы на вопросы)
   */
  usersWithResponses?: number;
}

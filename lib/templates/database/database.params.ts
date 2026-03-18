/**
 * @fileoverview Параметры для шаблона базы данных
 * @module templates/database/database.params
 */

/** Параметры для генерации функций базы данных */
export interface DatabaseTemplateParams {
  /** Включена ли база данных пользователей (asyncpg) */
  userDatabaseEnabled?: boolean;
  /** Есть логирование сообщений (нужна таблица bot_messages) */
  hasMessageLogging?: boolean;
  /** Есть таблица user_ids */
  hasUserIdsTable?: boolean;
  /** Есть таблица user_telegram_settings */
  hasTelegramSettingsTable?: boolean;
  /** Нужны функции чтения/записи переменных пользователя */
  hasUserDataAccess?: boolean;
}

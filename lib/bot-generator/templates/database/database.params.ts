/**
 * @fileoverview Параметры для шаблона базы данных
 * @module templates/database/database.params
 */

/** Параметры для генерации функций базы данных */
export interface DatabaseTemplateParams {
  /** Включена ли база данных пользователей (asyncpg) */
  userDatabaseEnabled?: boolean;
}

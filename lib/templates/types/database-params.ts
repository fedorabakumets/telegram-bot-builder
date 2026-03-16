/**
 * @fileoverview Параметры для шаблона базы данных (database.py.jinja2)
 * @module templates/types/database-params
 */

/** Параметры для генерации функций базы данных */
export interface DatabaseTemplateParams {
  /** Включена ли база данных пользователей */
  userDatabaseEnabled: boolean;
}

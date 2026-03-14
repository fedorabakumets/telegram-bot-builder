/**
 * @fileoverview Параметры для шаблона конфигурации
 * @module templates/config/config.params
 */

/** Параметры для генерации конфигурации бота */
export interface ConfigTemplateParams {
  /** Включена ли база данных пользователей (asyncpg, json) */
  userDatabaseEnabled: boolean;
  /** ID проекта для сохранения в базу данных */
  projectId: number | null;
}

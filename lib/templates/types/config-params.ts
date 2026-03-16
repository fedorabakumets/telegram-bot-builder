/**
 * @fileoverview Параметры для шаблона конфигурации (config.py.jinja2)
 * @module templates/types/config-params
 */

/** Параметры для генерации конфигурации бота */
export interface ConfigTemplateParams {
  /** Включена ли база данных пользователей */
  userDatabaseEnabled: boolean;
  /** ID проекта для сохранения в базу данных */
  projectId: number | null;
}

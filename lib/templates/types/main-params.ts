/**
 * @fileoverview Параметры для шаблона запуска бота (main.py.jinja2)
 * @module templates/types/main-params
 */

/** Параметры для генерации функции запуска бота */
export interface MainTemplateParams {
  /** Включена ли база данных пользователей */
  userDatabaseEnabled: boolean;
}

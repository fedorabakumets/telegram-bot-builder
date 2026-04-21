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
  /** URL вебхука (если задан — включается webhook режим) */
  webhookUrl?: string | null;
  /** Порт aiohttp сервера для webhook режима */
  webhookPort?: number | null;
}

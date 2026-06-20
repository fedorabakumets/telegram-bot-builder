/**
 * @fileoverview Параметры для шаблона конфигурации (config.py.jinja2)
 *
 * Канонический тип параметров конфигурации. Реэкспортируется из
 * `templates/types/config-params.ts` для использования в typed-renderer.
 *
 * @module templates/config/config.params
 */

/** Параметры для генерации конфигурации бота */
export interface ConfigTemplateParams {
  /** Включена ли база данных пользователей (asyncpg, json) */
  userDatabaseEnabled?: boolean;
  /** ID проекта для сохранения в базу данных */
  projectId?: number | null;
  /** URL вебхука (если задан — включается webhook режим) */
  webhookUrl?: string | null;
  /** Порт aiohttp сервера для webhook режима */
  webhookPort?: number | null;
  /** Есть ли узлы userbot_message (нужен Telethon клиент) */
  hasUserbotNodes?: boolean;
  /** Генерировать обёртку защиты контента от копирования/пересылки */
  protectContent?: boolean;
}

/**
 * @fileoverview Параметры для шаблона импортов (imports.py.jinja2)
 * @module templates/types/imports-params
 */

/** Параметры для генерации Python импортов */
export interface ImportsTemplateParams {
  /** Включена ли база данных пользователей (asyncpg, json) */
  userDatabaseEnabled: boolean;
  /** Есть ли inline кнопки (нужен TelegramBadRequest) */
  hasInlineButtons: boolean;
  /** Есть ли автопереходы (нужен TelegramBadRequest) */
  hasAutoTransitions: boolean;
  /** Есть ли узлы с медиа (нужен aiohttp) */
  hasMediaNodes: boolean;
  /** Есть ли ссылки на /uploads/ (нужен aiohttp) */
  hasUploadImages: boolean;
}

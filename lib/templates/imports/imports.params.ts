/**
 * @fileoverview Параметры для шаблона импортов
 * @module templates/imports/imports.params
 */

/** Параметры для генерации Python импортов */
export interface ImportsTemplateParams {
  /** Включена ли база данных пользователей (asyncpg, json) */
  userDatabaseEnabled?: boolean;
  /** Есть ли inline кнопки (нужен TelegramBadRequest) */
  hasInlineButtons?: boolean;
  /** Есть ли автопереходы (нужен TelegramBadRequest) */
  hasAutoTransitions?: boolean;
  /** Есть ли узлы с медиа (нужен aiohttp) */
  hasMediaNodes?: boolean;
  /** Есть ли ссылки на /uploads/ (нужен aiohttp) */
  hasUploadImages?: boolean;
  /** Есть ли узлы с HTML/Markdown форматированием (нужен ParseMode) */
  hasParseModeNodes?: boolean;
  /** Есть ли узлы с группами медиа (attachedMedia.length > 1) */
  hasMediaGroups?: boolean;
  /** Есть ли узлы с URL изображениями (imageUrl.startsWith('http')) */
  hasUrlImages?: boolean;
  /** Есть ли узлы требующие datetime */
  hasDatetimeNodes?: boolean;
  /** Есть ли узлы требующие timezone */
  hasTimezoneNodes?: boolean;
}

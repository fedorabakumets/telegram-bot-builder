/**
 * @fileoverview Параметры для шаблона заголовка
 * @module templates/header/header.params
 */

/**
 * Параметры для генерации заголовка файла
 * Параметры не используются, оставлены для совместимости API
 */
export interface HeaderTemplateParams {
  /** Включена ли база данных пользователей (не используется) */
  userDatabaseEnabled?: boolean;
  /** Есть ли inline кнопки (не используется) */
  hasInlineButtons?: boolean;
  /** Есть ли узлы с медиа (не используется) */
  hasMediaNodes?: boolean;
}

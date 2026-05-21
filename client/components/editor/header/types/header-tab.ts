/**
 * @fileoverview Типы вкладок заголовка
 * @description Определяет доступные вкладки навигации в редакторе
 */

/** Доступные вкладки навигации в заголовке */
export type HeaderTab = 
  | 'editor'
  | 'preview'
  | 'export'
  | 'bot'
  | 'users'
  | 'dialogs'
  | 'groups'
  | 'user-ids'
  | 'client-api'
  | 'broadcast'
  | 'analytics'
  | 'tables'
  | 'terminal';

/**
 * @fileoverview Параметры для шаблона middleware
 * @module templates/middleware/middleware.params
 */

/** Параметры для генерации middleware */
export interface MiddlewareTemplateParams {
  /** Включена ли база данных пользователей */
  userDatabaseEnabled?: boolean;
  /** Автоматически регистрировать пользователей при первом обращении */
  autoRegisterUsers?: boolean;
}

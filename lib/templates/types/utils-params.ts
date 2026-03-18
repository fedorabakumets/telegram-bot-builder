/**
 * @fileoverview Параметры для шаблона утилит (utils.py.jinja2)
 * @module templates/types/utils-params
 */

/** Параметры для генерации утилитарных функций */
export interface UtilsTemplateParams {
  /** Включена ли база данных пользователей */
  userDatabaseEnabled: boolean;
  /** Есть узлы с adminOnly */
  adminOnly?: boolean;
  /** Есть узлы с isPrivateOnly */
  isPrivateOnly?: boolean;
  /** Есть узлы с requiresAuth */
  requiresAuth?: boolean;
}

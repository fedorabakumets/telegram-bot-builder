/**
 * @fileoverview Параметры для шаблона утилит
 * @module templates/utils/utils-template.params
 */

/** Параметры для генерации утилитарных функций */
export interface UtilsTemplateParams {
  /** Включена ли база данных пользователей */
  userDatabaseEnabled: boolean;
  /** Есть узлы с adminOnly */
  adminOnly?: boolean;
  /** Есть узлы с requiresAuth */
  requiresAuth?: boolean;
}

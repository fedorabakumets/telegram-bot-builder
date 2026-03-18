/**
 * @fileoverview Параметры для шаблона обработчиков групп
 * @module templates/group-handlers/group-handlers.params
 */

export interface GroupHandlersTemplateParams {
  /** Конфигурация групп: { name: { id, isAdmin, settings } } */
  groupsConfig: Record<string, { id: string; isAdmin?: number; settings?: Record<string, unknown> }>;
}

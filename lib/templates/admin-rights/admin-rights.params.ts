/**
 * @fileoverview Параметры для шаблона обработчика прав администратора
 * @module templates/admin-rights/admin-rights.params
 */

export interface AdminRightsTemplateParams {
  /** ID узла */
  nodeId: string;
  /** Безопасное имя функции */
  safeName: string;
  /** Текст сообщения */
  messageText: string;
  /** Команда (без /) */
  command: string;
}

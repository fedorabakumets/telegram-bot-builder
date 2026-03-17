/**
 * @fileoverview Параметры шаблона command-navigation
 * @module templates/command-navigation/command-navigation.params
 */

/** Параметры для генерации навигации к узлу команды */
export interface CommandNavigationTemplateParams {
  /** Имя команды без '/' (например 'start', 'help') */
  commandName: string;
  /** Имя функции-обработчика (например 'start_handler') */
  handlerName: string;
  /** Уровень отступа (по умолчанию '    ') */
  indentLevel?: string;
}

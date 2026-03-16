/**
 * @fileoverview Параметры для шаблона запуска бота
 * @module templates/main/main.params
 */

/** Параметры для генерации функции запуска бота */
export interface MainTemplateParams {
  /** Включена ли база данных пользователей */
  userDatabaseEnabled?: boolean;
  /** Есть ли inline кнопки */
  hasInlineButtons?: boolean;
  /** Количество команд меню */
  menuCommandsCount?: number;
}

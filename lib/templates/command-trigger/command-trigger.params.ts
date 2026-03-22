/**
 * @fileoverview Параметры для шаблона обработчиков командных триггеров
 * @module templates/command-trigger/command-trigger.params
 */

/** Один командный триггер с метаданными узла */
export interface CommandTriggerEntry {
  /** ID узла command_trigger */
  nodeId: string;
  /** Команда, например "/start" или "/help" */
  command: string;
  /** Описание команды для BotFather */
  description?: string;
  /** Показывать команду в меню бота */
  showInMenu?: boolean;
  /** Только приватные чаты */
  isPrivateOnly?: boolean;
  /** Только для администраторов */
  adminOnly?: boolean;
  /** Требуется авторизация пользователя */
  requiresAuth?: boolean;
  /** Список текстовых синонимов для команды */
  synonyms?: string[];
  /** ID целевого узла — узел, к которому ведёт этот триггер */
  targetNodeId: string;
  /** Тип целевого узла */
  targetNodeType: string;
  /** Текст сообщения для отправки */
  messageText?: string;
  /** Режим форматирования: 'html', 'markdown', 'none' */
  formatMode?: 'html' | 'markdown' | 'none';
  /** Использует ли текст переменные пользователя */
  hasVariables?: boolean;
}

/** Параметры для генерации всех обработчиков командных триггеров */
export interface CommandTriggerTemplateParams {
  /** Массив командных триггеров */
  entries: CommandTriggerEntry[];
}

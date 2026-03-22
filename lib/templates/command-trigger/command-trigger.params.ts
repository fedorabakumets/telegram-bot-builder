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
  /** ID целевого узла — узел, к которому ведёт этот триггер */
  targetNodeId: string;
  /** Тип целевого узла */
  targetNodeType: string;
}

/** Параметры для генерации всех обработчиков командных триггеров */
export interface CommandTriggerTemplateParams {
  /** Массив командных триггеров */
  entries: CommandTriggerEntry[];
}

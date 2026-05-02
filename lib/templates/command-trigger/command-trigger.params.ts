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
  /** Только для администраторов */
  adminOnly?: boolean;
  /** Требуется авторизация пользователя */
  requiresAuth?: boolean;
  /** ID целевого узла */
  targetNodeId: string;
  /** Тип целевого узла */
  targetNodeType: string;
  /** Режим совпадения deep link параметра: точное или по префиксу */
  deepLinkMatchMode?: 'exact' | 'startsWith';
  /** Параметр deep link, например "ref" или "ref_" */
  deepLinkParam?: string;
  /** Сохранять значение параметра в переменную пользователя */
  deepLinkSaveToVar?: boolean;
  /** Имя переменной для сохранения значения deep link */
  deepLinkVarName?: string;
}

/** Параметры для генерации всех обработчиков командных триггеров */
export interface CommandTriggerTemplateParams {
  entries: CommandTriggerEntry[];
}

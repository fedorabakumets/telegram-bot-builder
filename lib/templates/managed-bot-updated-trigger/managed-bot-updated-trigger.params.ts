/**
 * @fileoverview Параметры для шаблона обработчиков триггеров обновления управляемого бота
 * @module templates/managed-bot-updated-trigger/managed-bot-updated-trigger.params
 */

/**
 * Один узел managed_bot_updated_trigger
 */
export interface ManagedBotUpdatedTriggerEntry {
  /** ID узла managed_bot_updated_trigger */
  nodeId: string;
  /** ID целевого узла */
  targetNodeId: string;
  /** Тип целевого узла */
  targetNodeType: string;
  /** Переменная для сохранения bot.id */
  saveBotIdTo?: string;
  /** Переменная для сохранения bot.username */
  saveBotUsernameTo?: string;
  /** Переменная для сохранения bot.first_name */
  saveBotNameTo?: string;
  /** Переменная для сохранения user.id создателя */
  saveCreatorIdTo?: string;
  /** Переменная для сохранения user.username создателя */
  saveCreatorUsernameTo?: string;
  /** Фильтр по user.id — если задан, реагирует только на этого пользователя */
  filterByUserId?: string;
}

/**
 * Параметры для генерации обработчиков триггеров обновления управляемого бота
 */
export interface ManagedBotUpdatedTriggerTemplateParams {
  /** Массив триггеров обновления управляемого бота */
  entries: ManagedBotUpdatedTriggerEntry[];
}

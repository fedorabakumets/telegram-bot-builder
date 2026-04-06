/**
 * @fileoverview Параметры для шаблона обработчиков узла получения токена управляемого бота
 * @module templates/get-managed-bot-token/get-managed-bot-token.params
 */

/**
 * Один узел get_managed_bot_token
 */
export interface GetManagedBotTokenEntry {
  /** ID узла get_managed_bot_token */
  nodeId: string;
  /** ID целевого узла для перехода после получения токена */
  targetNodeId: string;
  /** Тип целевого узла */
  targetNodeType: string;
  /** Источник bot_id: 'variable' — из переменной, 'manual' — вручную */
  botIdSource?: string;
  /** Имя переменной, содержащей bot_id */
  botIdVariable?: string;
  /** Ручной числовой ID бота */
  botIdManual?: string;
  /** Переменная для сохранения полученного токена */
  saveTokenTo?: string;
  /** Переменная для сохранения ошибки (опционально) */
  saveErrorTo?: string;
}

/**
 * Параметры для генерации обработчиков узла получения токена управляемого бота
 */
export interface GetManagedBotTokenTemplateParams {
  /** Массив записей узлов get_managed_bot_token */
  entries: GetManagedBotTokenEntry[];
}

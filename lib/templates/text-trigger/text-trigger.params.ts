/**
 * @fileoverview Параметры для шаблона обработчиков текстовых триггеров
 * @module templates/text-trigger/text-trigger.params
 */

/** Один текстовый триггер с метаданными узла */
export interface TextTriggerEntry {
  /** ID узла text_trigger */
  nodeId: string;
  /** Список текстовых фраз для срабатывания (из textSynonyms) */
  synonyms: string[];
  /** Тип совпадения: exact — точное, contains — содержит */
  matchType: 'exact' | 'contains';
  /** ID целевого узла — узел, к которому ведёт этот триггер */
  targetNodeId: string;
  /** Тип целевого узла */
  targetNodeType: string;
  /** Только для администраторов */
  adminOnly?: boolean;
  /** Требуется авторизация пользователя */
  requiresAuth?: boolean;
}

/** Параметры для генерации всех обработчиков текстовых триггеров */
export interface TextTriggerTemplateParams {
  /** Массив текстовых триггеров */
  entries: TextTriggerEntry[];
}

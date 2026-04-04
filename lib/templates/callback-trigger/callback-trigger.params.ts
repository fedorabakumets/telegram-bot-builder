/**
 * @fileoverview Параметры для шаблона обработчиков триггеров inline-кнопок
 * @module templates/callback-trigger/callback-trigger.params
 */

/** Один триггер inline-кнопки с метаданными узла */
export interface CallbackTriggerEntry {
  /** ID узла callback_trigger */
  nodeId: string;
  /** Значение callback_data для перехвата, например "confirm_order" */
  callbackData: string;
  /** Режим совпадения: "exact" — точное, "startswith" — начинается с */
  matchType: 'exact' | 'startswith';
  /** Только для администраторов */
  adminOnly?: boolean;
  /** Требуется авторизация пользователя */
  requiresAuth?: boolean;
  /** ID целевого узла */
  targetNodeId: string;
  /** Тип целевого узла */
  targetNodeType: string;
}

/** Параметры для генерации всех обработчиков триггеров inline-кнопок */
export interface CallbackTriggerTemplateParams {
  /** Массив записей триггеров inline-кнопок */
  entries: CallbackTriggerEntry[];
}

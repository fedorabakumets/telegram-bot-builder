/**
 * @fileoverview Параметры шаблона callback-handler-init
 * @module templates/callback-handler-init/callback-handler-init.params
 */

/** Параметры для генерации инициализации callback-обработчика */
export interface CallbackHandlerInitTemplateParams {
  /** ID узла */
  nodeId: string;
  /** Есть ли кнопки с hideAfterClick */
  hasHideAfterClick: boolean;
  /** Нужно ли генерировать синхронизацию FSM через state */
  includeStateSync?: boolean;
  /** Фильтры переменных (опционально) */
  variableFilters?: Record<string, any> | null;
  /** Уровень отступа (по умолчанию '    ') */
  indentLevel?: string;
}

/**
 * @fileoverview Параметры шаблона auto-transition
 * @module templates/auto-transition/auto-transition.params
 */

/** Параметры для генерации кода автоперехода */
export interface AutoTransitionTemplateParams {
  /** ID текущего узла */
  nodeId: string;
  /** ID целевого узла автоперехода */
  autoTransitionTarget: string;
  /** Существует ли целевой узел в графе */
  targetExists: boolean;
  /** Уровень отступа (по умолчанию '    ') */
  indentLevel?: string;
}

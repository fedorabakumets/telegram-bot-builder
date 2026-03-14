/**
 * @fileoverview Параметры для генерации условия перехода
 * Используется в generateConditionalBranch
 */

/**
 * Параметры для генерации условия if/elif
 */
export interface ConditionalBranchParams {
  /** Индекс узла в массиве (0 для if, остальные для elif) */
  index: number;
  /** ID узла для проверки */
  nodeId: string;
  /** Отступ для форматирования кода */
  indent?: string;
}

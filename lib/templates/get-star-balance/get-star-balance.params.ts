/**
 * @fileoverview Параметры шаблона get_star_balance
 * @module templates/get-star-balance/get-star-balance.params
 */

/** Один узел баланса звёзд бота */
export interface GetStarBalanceEntry {
  /** ID узла */
  nodeId: string;
  /** Безопасное имя Python-функции */
  safeName: string;
  /** Успешный переход */
  targetNodeId: string;
  /** Переменная для amount */
  saveStarBalanceTo: string;
  /** Не рвать сценарий */
  ignoreErrors: boolean;
  /** Текст ошибки */
  balanceMsgError: string;
  /** Выход ошибки */
  balanceErrorTarget: string;
}

/** Параметры шаблона */
export interface GetStarBalanceTemplateParams {
  /** Узлы */
  entries: GetStarBalanceEntry[];
}

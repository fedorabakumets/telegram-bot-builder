/**
 * @fileoverview Параметры шаблона узла refund_stars
 * @module templates/refund-stars/refund-stars.params
 */

/** Источник ID пользователя для возврата */
export type RefundUserSource = 'current_user' | 'custom';

/**
 * Один узел возврата звёзд
 */
export interface RefundStarsEntry {
  /** ID узла */
  nodeId: string;
  /** Безопасное имя для Python-функции */
  safeName: string;
  /** ID следующего узла после успешного возврата */
  targetNodeId: string;
  /** Тип следующего узла */
  targetNodeType: string;
  /** Источник user_id */
  refundUserSource: RefundUserSource;
  /** ID пользователя или {переменная} при custom */
  refundUserId: string;
  /** Код покупки или {переменная} */
  refundChargeId: string;
  /** Не прерывать сценарий при ошибке */
  ignoreErrors: boolean;
}

/**
 * Параметры генерации обработчиков refund_stars
 */
export interface RefundStarsTemplateParams {
  /** Массив узлов возврата */
  entries: RefundStarsEntry[];
}

/**
 * @fileoverview Параметры шаблона edit_star_subscription
 * @module templates/edit-star-subscription/edit-star-subscription.params
 */

/** Источник user_id */
export type SubscriptionUserSource = 'current_user' | 'custom';

/** Действие над автопродлением */
export type SubscriptionAction = 'cancel' | 'enable';

/** Один узел управления подпиской */
export interface EditStarSubscriptionEntry {
  /** ID узла */
  nodeId: string;
  /** Безопасное имя Python-функции */
  safeName: string;
  /** Успешный переход */
  targetNodeId: string;
  /** Источник user_id */
  subscriptionUserSource: SubscriptionUserSource;
  /** ID при custom */
  subscriptionUserId: string;
  /** Код покупки */
  subscriptionChargeId: string;
  /** cancel → is_canceled True */
  subscriptionAction: SubscriptionAction;
  /** Не рвать сценарий */
  ignoreErrors: boolean;
  /** Текст пустого кода */
  subscriptionMsgEmpty: string;
  /** Текст ошибки */
  subscriptionMsgError: string;
  /** Выход пустого кода */
  subscriptionEmptyTarget: string;
  /** Выход ошибки */
  subscriptionErrorTarget: string;
}

/** Параметры шаблона */
export interface EditStarSubscriptionTemplateParams {
  /** Узлы */
  entries: EditStarSubscriptionEntry[];
}

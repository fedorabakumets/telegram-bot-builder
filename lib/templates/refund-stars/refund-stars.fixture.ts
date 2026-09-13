/**
 * @fileoverview Тестовые фикстуры для шаблона refund_stars
 * @module templates/refund-stars/refund-stars.fixture
 */

import type { RefundStarsTemplateParams } from './refund-stars.params';

/** Фикстура: пустой массив */
export const fixtureRefundStarsEmpty: RefundStarsTemplateParams = {
  entries: [],
};

/** Фикстура: возврат текущему пользователю */
export const fixtureRefundStarsCurrent: RefundStarsTemplateParams = {
  entries: [{
    nodeId: 'refund1',
    safeName: 'refund1',
    targetNodeId: 'msg_thanks',
    targetNodeType: 'message',
    refundUserSource: 'current_user',
    refundUserId: '',
    refundChargeId: '{payment_charge_id}',
    ignoreErrors: false,
  }],
};

/** Фикстура: возврат по custom user id с ignoreErrors */
export const fixtureRefundStarsCustom: RefundStarsTemplateParams = {
  entries: [{
    nodeId: 'refund_custom',
    safeName: 'refund_custom',
    targetNodeId: 'msg_ok',
    targetNodeType: 'message',
    refundUserSource: 'custom',
    refundUserId: '{target_user}',
    refundChargeId: 'charge_abc',
    ignoreErrors: true,
  }],
};

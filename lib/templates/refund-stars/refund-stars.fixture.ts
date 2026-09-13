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
    refundMsgEmpty: 'Пожалуйста, укажите код покупки: /back КОД',
    refundMsgNotFound: 'Такой код покупки не найден. Проверьте данные и попробуйте снова.',
    refundMsgAlreadyRefunded: 'За эту покупку уже ранее был произведён возврат.',
    refundEmptyTarget: '',
    refundNotFoundTarget: '',
    refundAlreadyRefundedTarget: '',
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
    refundMsgEmpty: 'Укажите код',
    refundMsgNotFound: 'Код не найден',
    refundMsgAlreadyRefunded: 'Уже возвращено',
    refundEmptyTarget: '',
    refundNotFoundTarget: '',
    refundAlreadyRefundedTarget: '',
  }],
};

/** Фикстура: выходы ошибок на холсте */
export const fixtureRefundStarsErrorTargets: RefundStarsTemplateParams = {
  entries: [{
    nodeId: 'refund_err',
    safeName: 'refund_err',
    targetNodeId: 'msg_ok',
    targetNodeType: 'message',
    refundUserSource: 'current_user',
    refundUserId: '',
    refundChargeId: '{cid}',
    ignoreErrors: false,
    refundMsgEmpty: 'fallback empty',
    refundMsgNotFound: 'fallback not found',
    refundMsgAlreadyRefunded: 'fallback already',
    refundEmptyTarget: 'msg_empty',
    refundNotFoundTarget: 'msg_not_found',
    refundAlreadyRefundedTarget: 'msg_already',
  }],
};

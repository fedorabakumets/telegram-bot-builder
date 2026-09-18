/**
 * @fileoverview Unit-тесты шаблона edit_star_subscription
 */

import { describe, expect, it } from 'vitest';
import {
  generateEditStarSubscription,
  generateEditStarSubscriptionHandlers,
} from './edit-star-subscription.renderer';
import type { Node } from '@shared/schema';

describe('generateEditStarSubscription()', () => {
  it('пустой массив → пустая строка', () => {
    expect(generateEditStarSubscription({ entries: [] })).toBe('');
  });

  it('cancel → is_canceled=True', () => {
    const code = generateEditStarSubscription({
      entries: [
        {
          nodeId: 'sub1',
          safeName: 'sub1',
          targetNodeId: 'ok',
          subscriptionUserSource: 'current_user',
          subscriptionUserId: '',
          subscriptionChargeId: '{payment_charge_id}',
          subscriptionAction: 'cancel',
          ignoreErrors: false,
          subscriptionMsgEmpty: 'empty',
          subscriptionMsgError: 'err',
          subscriptionEmptyTarget: '',
          subscriptionErrorTarget: '',
        },
      ],
    });
    expect(code).toContain('edit_user_star_subscription');
    expect(code).toContain('is_canceled=True');
  });

  it('enable → is_canceled=False', () => {
    const code = generateEditStarSubscription({
      entries: [
        {
          nodeId: 'sub2',
          safeName: 'sub2',
          targetNodeId: '',
          subscriptionUserSource: 'current_user',
          subscriptionUserId: '',
          subscriptionChargeId: 'chg',
          subscriptionAction: 'enable',
          ignoreErrors: false,
          subscriptionMsgEmpty: 'empty',
          subscriptionMsgError: 'err',
          subscriptionEmptyTarget: '',
          subscriptionErrorTarget: '',
        },
      ],
    });
    expect(code).toContain('is_canceled=False');
  });
});

describe('generateEditStarSubscriptionHandlers()', () => {
  it('собирает узлы с холста', () => {
    const nodes = [
      {
        id: 'edit1',
        type: 'edit_star_subscription',
        position: { x: 0, y: 0 },
        data: {
          subscriptionChargeId: '{payment_charge_id}',
          subscriptionAction: 'cancel',
          autoTransitionTo: 'msg_ok',
          enableAutoTransition: true,
        },
      },
    ] as unknown as Node[];
    const code = generateEditStarSubscriptionHandlers(nodes);
    expect(code).toContain('edit_user_star_subscription');
    expect(code).toContain('handle_callback_edit1');
  });
});

/**
 * @fileoverview Unit-тесты шаблона refund_stars
 * @module templates/refund-stars/refund-stars.test
 */

import { describe, it, expect } from 'vitest';
import {
  generateRefundStars,
  generateRefundStarsHandlers,
  collectRefundStarsEntries,
} from './refund-stars.renderer';
import {
  fixtureRefundStarsEmpty,
  fixtureRefundStarsCurrent,
  fixtureRefundStarsCustom,
} from './refund-stars.fixture';
import { refundStarsParamsSchema } from './refund-stars.schema';
import type { Node } from '@shared/schema';

describe('refundStarsParamsSchema', () => {
  it('валидирует пустой массив', () => {
    expect(refundStarsParamsSchema.safeParse(fixtureRefundStarsEmpty).success).toBe(true);
  });

  it('валидирует корректный entry', () => {
    expect(refundStarsParamsSchema.safeParse(fixtureRefundStarsCurrent).success).toBe(true);
  });
});

describe('generateRefundStars()', () => {
  it('пустые entries → пустая строка', () => {
    expect(generateRefundStars(fixtureRefundStarsEmpty)).toBe('');
  });

  it('генерирует refund_star_payment и автопереход', () => {
    const code = generateRefundStars(fixtureRefundStarsCurrent);
    expect(code).toContain('refund_star_payment');
    expect(code).toContain('handle_callback_refund1');
    expect(code).toContain('handle_callback_msg_thanks');
    expect(code).toContain('payment_charge_id');
  });

  it('custom user + ignoreErrors', () => {
    const code = generateRefundStars(fixtureRefundStarsCustom);
    expect(code).toContain('target_user');
    expect(code).toContain('except Exception');
    expect(code).toContain('charge_abc');
  });
});

describe('collectRefundStarsEntries / generateRefundStarsHandlers', () => {
  it('собирает узлы refund_stars', () => {
    const nodes = [
      {
        id: 'r1',
        type: 'refund_stars',
        position: { x: 0, y: 0 },
        data: {
          refundUserSource: 'current_user',
          refundChargeId: '{cid}',
          autoTransitionTo: 'm1',
        },
      },
      {
        id: 'm1',
        type: 'message',
        position: { x: 1, y: 0 },
        data: { messageText: 'ok' },
      },
    ] as unknown as Node[];

    const entries = collectRefundStarsEntries(nodes);
    expect(entries).toHaveLength(1);
    expect(entries[0].targetNodeId).toBe('m1');

    const code = generateRefundStarsHandlers(nodes);
    expect(code).toContain('refund_star_payment');
    expect(code).toContain('handle_callback_m1');
  });
});

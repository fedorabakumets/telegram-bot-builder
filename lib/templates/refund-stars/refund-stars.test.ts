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
  fixtureRefundStarsErrorTargets,
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

  it('валидирует entry с error targets', () => {
    expect(refundStarsParamsSchema.safeParse(fixtureRefundStarsErrorTargets).success).toBe(true);
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
    expect(code).toContain('CHARGE_ALREADY_REFUNDED');
    expect(code).toContain('Уже возвращено');
  });

  it('включает тексты ошибок CHARGE_* и дефолты', () => {
    const code = generateRefundStars(fixtureRefundStarsCurrent);
    expect(code).toContain('CHARGE_ALREADY_REFUNDED');
    expect(code).toContain('CHARGE_NOT_FOUND');
    expect(code).toContain('Пожалуйста, укажите код покупки');
    expect(code).toContain('Такой код покупки не найден');
    expect(code).toContain('уже ранее был произведён возврат');
    expect(code).toContain('callback_query.message.answer');
    expect(code).not.toMatch(/except Exception[\s\S]*?\braise\b/);
  });

  it('при error targets переходит без fallback answer на этих ветках', () => {
    const code = generateRefundStars(fixtureRefundStarsErrorTargets);
    expect(code).toContain('handle_callback_msg_empty');
    expect(code).toContain('handle_callback_msg_not_found');
    expect(code).toContain('handle_callback_msg_already');
    expect(code).toContain('CHARGE_ALREADY_REFUNDED');
    expect(code).toContain('CHARGE_NOT_FOUND');
    // fallback-тексты не должны идти перед переходом на already/not_found/empty targets
    const alreadyBlock = code.slice(
      code.indexOf('CHARGE_ALREADY_REFUNDED'),
      code.indexOf('elif not _charge_id'),
    );
    expect(alreadyBlock).toContain('handle_callback_msg_already');
    expect(alreadyBlock).not.toContain('callback_query.message.answer');
  });
});

describe('collectRefundStarsEntries / generateRefundStarsHandlers', () => {
  it('собирает узлы refund_stars и error targets', () => {
    const nodes = [
      {
        id: 'r1',
        type: 'refund_stars',
        position: { x: 0, y: 0 },
        data: {
          refundUserSource: 'current_user',
          refundChargeId: '{cid}',
          autoTransitionTo: 'm1',
          refundNotFoundTarget: 'm_nf',
          refundEmptyTarget: 'm_empty',
          refundAlreadyRefundedTarget: 'm_al',
        },
      },
      {
        id: 'm1',
        type: 'message',
        position: { x: 1, y: 0 },
        data: { messageText: 'ok' },
      },
      {
        id: 'm_nf',
        type: 'message',
        position: { x: 1, y: 1 },
        data: { messageText: 'nf' },
      },
      {
        id: 'm_empty',
        type: 'message',
        position: { x: 1, y: 2 },
        data: { messageText: 'empty' },
      },
      {
        id: 'm_al',
        type: 'message',
        position: { x: 1, y: 3 },
        data: { messageText: 'already' },
      },
    ] as unknown as Node[];

    const entries = collectRefundStarsEntries(nodes);
    expect(entries).toHaveLength(1);
    expect(entries[0].targetNodeId).toBe('m1');
    expect(entries[0].refundNotFoundTarget).toBe('m_nf');
    expect(entries[0].refundEmptyTarget).toBe('m_empty');
    expect(entries[0].refundAlreadyRefundedTarget).toBe('m_al');

    const code = generateRefundStarsHandlers(nodes);
    expect(code).toContain('refund_star_payment');
    expect(code).toContain('handle_callback_m1');
    expect(code).toContain('handle_callback_m_nf');
    expect(code).toContain('handle_callback_m_empty');
    expect(code).toContain('handle_callback_m_al');
  });
});

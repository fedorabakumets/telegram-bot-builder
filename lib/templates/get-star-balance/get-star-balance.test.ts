/**
 * @fileoverview Unit-тесты шаблона get_star_balance
 */

import { describe, expect, it } from 'vitest';
import {
  generateGetStarBalance,
  generateGetStarBalanceHandlers,
} from './get-star-balance.renderer';
import type { Node } from '@shared/schema';

describe('generateGetStarBalance()', () => {
  it('пустой массив → пустая строка', () => {
    expect(generateGetStarBalance({ entries: [] })).toBe('');
  });

  it('вызывает get_my_star_balance и пишет в user_data', () => {
    const code = generateGetStarBalance({
      entries: [
        {
          nodeId: 'bal1',
          safeName: 'bal1',
          targetNodeId: 'ok',
          saveStarBalanceTo: 'star_balance',
          ignoreErrors: false,
          balanceMsgError: 'err',
          balanceErrorTarget: '',
        },
      ],
    });
    expect(code).toContain('get_my_star_balance');
    expect(code).toContain("user_data[user_id][\"star_balance\"]");
    expect(code).toContain('handle_callback_ok');
  });

  it('ветка ошибки с balanceErrorTarget', () => {
    const code = generateGetStarBalance({
      entries: [
        {
          nodeId: 'bal2',
          safeName: 'bal2',
          targetNodeId: '',
          saveStarBalanceTo: 'my_bal',
          ignoreErrors: false,
          balanceMsgError: 'fail',
          balanceErrorTarget: 'err_node',
        },
      ],
    });
    expect(code).toContain('handle_callback_err_node');
    expect(code).toContain("user_data[user_id][\"my_bal\"]");
  });
});

describe('generateGetStarBalanceHandlers()', () => {
  it('собирает узлы с холста', () => {
    const nodes = [
      {
        id: 'bal1',
        type: 'get_star_balance',
        position: { x: 0, y: 0 },
        data: {
          saveStarBalanceTo: 'star_balance',
          autoTransitionTo: 'msg_ok',
          enableAutoTransition: true,
        },
      },
    ] as unknown as Node[];
    const code = generateGetStarBalanceHandlers(nodes);
    expect(code).toContain('get_my_star_balance');
    expect(code).toContain('handle_callback_bal1');
  });
});

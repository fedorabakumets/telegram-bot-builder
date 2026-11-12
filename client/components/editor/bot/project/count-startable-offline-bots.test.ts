/**
 * @fileoverview Счётчик офлайн-ботов для массового запуска
 * @module editor/bot/project/count-startable-offline-bots.test
 */

import { describe, expect, it } from 'vitest';
import { countStartableOfflineBots } from './count-startable-offline-bots';

describe('countStartableOfflineBots', () => {
  /** Незавершённый запрос запуска не считается остановленным процессом. */
  it('не считает запускающихся ботов офлайн', () => {
    expect(countStartableOfflineBots([{ id: 1 }, { id: 2 }, { id: 3 }], [
      { tokenId: 1, status: 'requested' }, { tokenId: 2, status: 'starting' }, { tokenId: 3, status: 'error' },
    ])).toBe(1);
  });
  it('не считает ботов с недействительным токеном', () => {
    const count = countStartableOfflineBots(
      [
        { id: 1, isActive: 0 },
        { id: 2, isActive: 1 },
        { id: 3, isActive: 1 },
      ],
      [
        { tokenId: 1, status: 'stopped' },
        { tokenId: 2, status: 'stopped' },
        { tokenId: 3, status: 'running' },
      ],
    );
    expect(count).toBe(1);
  });

  it('считает остановленных с живым токеном', () => {
    const count = countStartableOfflineBots(
      [{ id: 1, isActive: 1 }, { id: 2, isActive: 1 }],
      [{ tokenId: 1, status: 'stopped' }, { tokenId: 2, status: 'error' }],
    );
    expect(count).toBe(2);
  });
});

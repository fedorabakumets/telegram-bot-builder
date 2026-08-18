/**
 * @fileoverview Тесты отказа запуска при isActive=0
 * @module server/bots/refuse-inactive-bot-start.test
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BOT_UNAUTHORIZED_HINT } from '@shared/broadcast-unauthorized';
import { refuseInactiveBotStart } from './refuse-inactive-bot-start';

describe('refuseInactiveBotStart', () => {
  it('пропускает живой токен', () => {
    assert.equal(refuseInactiveBotStart(1), null);
    assert.equal(refuseInactiveBotStart(null), null);
    assert.equal(refuseInactiveBotStart(undefined), null);
  });

  it('отказывает при isActive=0 без воркера', () => {
    assert.equal(refuseInactiveBotStart(0), BOT_UNAUTHORIZED_HINT);
  });
});

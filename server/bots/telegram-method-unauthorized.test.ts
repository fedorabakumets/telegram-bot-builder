/**
 * @fileoverview Тесты разбора 401 Telegram Bot API
 * @module server/bots/telegram-method-unauthorized.test
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isTelegramMethodUnauthorized } from './telegram-method-unauthorized';

describe('isTelegramMethodUnauthorized', () => {
  it('ловит HTTP 401 без тела', () => {
    assert.equal(isTelegramMethodUnauthorized(401, null), true);
  });

  it('ловит ok:false + Unauthorized', () => {
    assert.equal(
      isTelegramMethodUnauthorized(200, {
        ok: false,
        error_code: 401,
        description: 'Unauthorized: invalid token specified',
      }),
      true,
    );
  });

  it('не считает сеть/500 отзывом токена', () => {
    assert.equal(isTelegramMethodUnauthorized(500, null), false);
    assert.equal(isTelegramMethodUnauthorized(200, { ok: true }), false);
  });
});

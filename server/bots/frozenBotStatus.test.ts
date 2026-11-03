/** @fileoverview Проверка распознавания ограничения Telegram. */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isBotFrozen, isFrozenBotError, recordFrozenBotError } from './frozenBotStatus';

describe('Распознавание замороженного бота', () => {
  it('распознаёт явную ошибку Telegram и не путает её с другими ошибками', () => {
    assert.equal(isFrozenBotError('Telegram server says - Bad Request: FROZEN_METHOD_INVALID'), true);
    assert.equal(isFrozenBotError('Unauthorized: invalid token'), false);
    assert.equal(isFrozenBotError('FROZEN_METHOD_INVALID_EXTRA'), false);
    assert.equal(isFrozenBotError(undefined), false);
  });
  it('сохраняет ограничение только для соответствующего бота и проекта', () => {
    assert.equal(recordFrozenBotError(12, 10, 'FROZEN_METHOD_INVALID'), true);
    assert.equal(isBotFrozen(12, 10), true);
    assert.equal(isBotFrozen(12, 11), false);
    assert.equal(isBotFrozen(13, 10), false);
  });
});

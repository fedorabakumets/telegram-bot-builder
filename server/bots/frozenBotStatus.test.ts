/** @fileoverview Проверка распознавания ограничения Telegram. */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { bindFrozenBotIdentity, isBotFrozen, isFrozenBotError, recordFrozenBotError } from './frozenBotStatus';

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

/** Подтверждённая заморозка относится к личности Telegram, а не к работающему процессу. */
describe('привязка ограничения к Telegram-боту', () => {
  it('сохраняет ограничение при повторном запуске и ротации токена того же бота', () => {
    bindFrozenBotIdentity(41, 1, '111:old');
    recordFrozenBotError(41, 1, 'FROZEN_METHOD_INVALID');
    bindFrozenBotIdentity(41, 1, '111:new');
    assert.equal(isBotFrozen(41, 1, '111:new'), true);
    assert.equal(isBotFrozen(41, 1), true);
  });
  it('другой Telegram-бот в прежнем слоте не наследует ограничение', () => {
    bindFrozenBotIdentity(41, 2, '222:old');
    recordFrozenBotError(41, 2, 'FROZEN_METHOD_INVALID');
    assert.equal(isBotFrozen(41, 2, '333:new'), false);
  });
  it('пустая или скрытая строка не снимает подтверждённое ограничение', () => {
    bindFrozenBotIdentity(41, 3, '444:old');
    recordFrozenBotError(41, 3, 'FROZEN_METHOD_INVALID');
    assert.equal(isBotFrozen(41, 3, 'hidden'), true);
  });
});

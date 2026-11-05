/**
 * @fileoverview Проверка HTTP-статусов ошибок запуска бота
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BOT_LOCK_BUSY_ERROR } from '../../../bots/waitForBotRedisLock';
import { botStartErrorStatus } from './botStartErrorStatus';

describe('botStartErrorStatus', () => {
  it('возвращает конфликт для занятой блокировки', () => {
    assert.equal(botStartErrorStatus(BOT_LOCK_BUSY_ERROR), 409);
  });
  it('оставляет статус ошибки сервера для других ошибок', () => {
    assert.equal(botStartErrorStatus('Ошибка Telegram'), 500);
    assert.equal(botStartErrorStatus(undefined), 500);
  });
});

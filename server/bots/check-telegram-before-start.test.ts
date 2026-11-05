/**
 * @fileoverview Проверки отказов Telegram перед запуском бота
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkTelegramBeforeStart } from './check-telegram-before-start';

describe('checkTelegramBeforeStart', () => {
  it('сбрасывает webhook отдельным запросом непосредственно перед polling', async () => {
    let url = '';
    const result = await checkTelegramBeforeStart('test', 'deleteWebhook', async (value) => {
      url = value;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    assert.equal(result.ok, true);
    assert.match(url, /deleteWebhook\?drop_pending_updates=false$/);
  });

  it('проверяет токен без изменения webhook через getMe', async () => {
    let url = '';
    const result = await checkTelegramBeforeStart('test', 'getMe', async (value) => {
      url = value;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    assert.equal(result.ok, true);
    assert.match(url, /\/getMe$/);
  });

  it('отклоняет 404 и не помечает токен как недействительный', async () => {
    const result = await checkTelegramBeforeStart('secret', 'getMe', async () =>
      new Response(JSON.stringify({ ok: false, error_code: 404, description: 'Not Found' }), { status: 404 }));
    assert.equal(result.ok, false);
    assert.equal(result.unauthorized, false);
    assert.match(result.error!, /404/);
    assert.doesNotMatch(result.error!, /secret/);
  });

  it('отличает отказ авторизации от сетевой ошибки и неверного ответа', async () => {
    const unauthorized = await checkTelegramBeforeStart('test', 'getMe', async () =>
      new Response(JSON.stringify({ ok: false, error_code: 401, description: 'Unauthorized' }), { status: 401 }));
    assert.equal(unauthorized.unauthorized, true);
    const network = await checkTelegramBeforeStart('test', 'getMe', async () => { throw new Error('secret'); });
    assert.equal(network.ok, false);
    assert.equal(network.unauthorized, false);
    assert.doesNotMatch(network.error!, /secret/);
    const malformed = await checkTelegramBeforeStart('test', 'getMe', async () => new Response('invalid'));
    assert.equal(malformed.ok, false);
  });
});

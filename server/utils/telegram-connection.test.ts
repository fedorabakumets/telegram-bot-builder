/**
 * @fileoverview Проверки выбора подключения и объяснения ошибок Telegram.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { setRuntimeOverlay } from '../services/runtime-overlay';
import { getTelegramConnection, validateTelegramProxy } from './telegram-connection';
import { describeTelegramError } from '../admin/telegram-connection-test';

/** Исходные переменные Telegram для восстановления после проверок. */
const originalMode = process.env.TELEGRAM_CONNECTION_MODE;
/** Исходный адрес прокси Telegram. */
const originalProxy = process.env.TELEGRAM_PROXY_URL;
/** Прокси окружения, действовавший до применения настроек панели. */
const environmentProxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
delete process.env.TELEGRAM_CONNECTION_MODE;
delete process.env.TELEGRAM_PROXY_URL;

after(() => {
  if (originalMode === undefined) delete process.env.TELEGRAM_CONNECTION_MODE;
  else process.env.TELEGRAM_CONNECTION_MODE = originalMode;
  if (originalProxy === undefined) delete process.env.TELEGRAM_PROXY_URL;
  else process.env.TELEGRAM_PROXY_URL = originalProxy;
  setRuntimeOverlay({});
});

test('режимы выбирают прямое подключение, заданный прокси и окружение', () => {
  setRuntimeOverlay({ TELEGRAM_CONNECTION_MODE: 'direct', TELEGRAM_PROXY_URL: 'http://localhost:8080' });
  assert.deepEqual(getTelegramConnection(), { mode: 'direct', proxy: undefined });
  setRuntimeOverlay({ TELEGRAM_CONNECTION_MODE: 'proxy', TELEGRAM_PROXY_URL: 'http://localhost:8080' });
  assert.deepEqual(getTelegramConnection(), { mode: 'proxy', proxy: 'http://localhost:8080/' });
  setRuntimeOverlay({ TELEGRAM_CONNECTION_MODE: 'auto' });
  assert.equal(getTelegramConnection().proxy, environmentProxy ? validateTelegramProxy(environmentProxy) : undefined);
  setRuntimeOverlay({ TELEGRAM_CONNECTION_MODE: 'proxy' });
  assert.throws(() => getTelegramConnection(), /Укажите адрес прокси/);
  assert.throws(() => validateTelegramProxy('не адрес'));
});

test('диагностика объясняет сетевые ошибки и ошибки SOCKS', () => {
  assert.match(describeTelegramError(new Error('Socks5 Authentication failed')), /авторизац/);
  assert.match(describeTelegramError(new Error('no accepted authentication type')), /авторизац/);
  assert.match(describeTelegramError(new Error('Socks5 proxy rejected connection')), /отклонено/);
  assert.match(describeTelegramError({ cause: { code: 'ENOTFOUND' } }), /DNS/);
  assert.match(describeTelegramError({ cause: { code: 'ETIMEDOUT' } }), /ожидания/);
  assert.match(describeTelegramError({ cause: { code: 'ECONNREFUSED' } }), /отклонено/);
});

 test('значения формы проверяются отдельно от сохранённых настроек', () => {
  setRuntimeOverlay({ TELEGRAM_CONNECTION_MODE: 'direct', TELEGRAM_PROXY_URL: 'http://localhost:8080' });
  assert.deepEqual(getTelegramConnection({ mode: 'proxy', proxy: 'socks5://localhost:1080' }), { mode: 'proxy', proxy: 'socks5://localhost:1080' });
  assert.deepEqual(getTelegramConnection(), { mode: 'direct', proxy: undefined });
  assert.throws(() => getTelegramConnection({ mode: 'proxy', proxy: 'не адрес' }));
 });

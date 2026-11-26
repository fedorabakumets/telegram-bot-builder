/** @fileoverview Проверяет границу полномочий дочернего брокера без системных процессов. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { telegramBrokerProcessEnv } from './telegram-broker-process-env';

test('брокер получает только необходимые секреты и системные пути', () => {
  const result = telegramBrokerProcessEnv({
    Path: 'synthetic-path', SystemRoot: 'synthetic-windows', HOME: 'synthetic-home',
    REDIS_URL: 'redis://synthetic.invalid', TELETHON_BROKER_SECRET: 'synthetic-broker-secret',
    TELETHON_BROKER_LOCK_FILE: '/synthetic/broker.lock', DATABASE_URL: 'synthetic-private-db',
    PROJECT_TELEGRAM_RUNNER_SECRET: 'synthetic-runner-secret', BOT_TOKEN: 'synthetic-bot-token',
    TELETHON_BROKER_STDIN_CONTROL: '0',
  });
  assert.equal(result.Path, 'synthetic-path');
  assert.equal(result.SystemRoot, 'synthetic-windows');
  assert.equal(result.REDIS_URL, 'redis://synthetic.invalid');
  assert.equal(result.TELETHON_BROKER_SECRET, 'synthetic-broker-secret');
  assert.equal(result.TELETHON_BROKER_STDIN_CONTROL, '1');
  for (const key of ['DATABASE_URL', 'PROJECT_TELEGRAM_RUNNER_SECRET', 'BOT_TOKEN']) assert.equal(result[key], undefined);
});

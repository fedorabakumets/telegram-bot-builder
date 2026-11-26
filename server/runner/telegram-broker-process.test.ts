/** @fileoverview Проверки готовности, отказов и завершения встроенного брокера без Telegram. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { startTelegramBrokerProcess } from './telegram-broker-process';
import { telegramBrokerFixture } from './telegram-broker-process-fixture';

test('external по умолчанию не создаёт процесс и закрывается повторно', async () => {
  const fixture = telegramBrokerFixture();
  const broker = await startTelegramBrokerProcess({ ...fixture.options, env: {} });
  await broker.close(); await broker.close();
  assert.equal(fixture.calls.length, 0);
});

test('неправильный режим и отсутствующий секрет отклоняются до spawn', async () => {
  const fixture = telegramBrokerFixture();
  await assert.rejects(startTelegramBrokerProcess({ ...fixture.options, env: { TELETHON_BROKER_MODE: 'unknown' } }), /MODE/);
  await assert.rejects(startTelegramBrokerProcess({ ...fixture.options,
    env: { ...fixture.options.env, TELETHON_BROKER_SECRET: 'short' } }), /секрет/);
  assert.equal(fixture.calls.length, 0);
});

test('единственный процесс готов только после полного маркера; закрытие через stdin', async () => {
  const fixture = telegramBrokerFixture();
  let ready = false;
  const preparation = startTelegramBrokerProcess(fixture.options).then(value => { ready = true; return value; });
  fixture.child.stdout.write('TELETHON_BROKER_');
  await Promise.resolve(); assert.equal(ready, false);
  fixture.child.stdout.write('READY\n');
  const broker = await preparation;
  assert.equal(fixture.calls.length, 1);
  assert.deepEqual(fixture.calls[0].slice(0, 2), ['synthetic-python', ['-u', join('/synthetic/python', 'telethon_account_broker.py')]]);
  const spawnOptions = fixture.calls[0][2] as { /** Окружение дочернего процесса. */ env: NodeJS.ProcessEnv };
  assert.equal(spawnOptions.env.TELETHON_BROKER_STDIN_CONTROL, '1');
  await Promise.all([broker.close(), broker.close()]);
  assert.equal(fixture.child.input, 'shutdown\n');
  assert.deepEqual(fixture.child.signals, []);
  assert.deepEqual(fixture.failures, []);
});

test('падение после готовности вызывает fail-closed без нового процесса', async () => {
  const fixture = telegramBrokerFixture();
  const preparation = startTelegramBrokerProcess(fixture.options);
  fixture.child.stdout.write('TELETHON_BROKER_READY\n');
  const broker = await preparation;
  fixture.child.emit('exit', 1, null);
  assert.equal(fixture.failures.length, 1);
  assert.equal(fixture.calls.length, 1);
  await broker.close();
});

test('отказ до готовности запрещает готовность исполнителя', async () => {
  const fixture = telegramBrokerFixture();
  const preparation = startTelegramBrokerProcess(fixture.options);
  fixture.child.emit('exit', 1, null);
  await assert.rejects(preparation, /завершился/);
  assert.deepEqual(fixture.failures, []);
});

test('отмена подготовки штатно закрывает собственный процесс', async () => {
  const fixture = telegramBrokerFixture(), controller = new AbortController();
  const preparation = startTelegramBrokerProcess({ ...fixture.options, signal: controller.signal });
  controller.abort();
  await assert.rejects(preparation, /отменена/);
  assert.equal(fixture.child.input, 'shutdown\n');
});

test('таймаут готовности закрывает процесс и не выдаёт успешный handle', async () => {
  const fixture = telegramBrokerFixture();
  await assert.rejects(startTelegramBrokerProcess({ ...fixture.options, startupTimeoutMs: 2 }), /готовность/);
  assert.equal(fixture.child.input, 'shutdown\n');
});

test('зависшее закрытие ограниченно усиливается SIGTERM и SIGKILL', async () => {
  const fixture = telegramBrokerFixture();
  fixture.child.exitOnShutdown = false;
  fixture.child.exitOnSignal = 'SIGKILL';
  const preparation = startTelegramBrokerProcess(fixture.options);
  fixture.child.stdout.write('TELETHON_BROKER_READY\n');
  const broker = await preparation;
  await assert.rejects(broker.close(), /принудительного/);
  assert.deepEqual(fixture.child.signals, ['SIGTERM', 'SIGKILL']);
  assert.deepEqual(fixture.failures, []);
});

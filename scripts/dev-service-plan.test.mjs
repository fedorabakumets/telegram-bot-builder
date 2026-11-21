/** @fileoverview Проверки конфигурации dev-сервисов без процессов, сети и Telegram. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createDevServicePlan } from './dev-service-plan.mjs';

/** Возвращает окружение одного сервиса из проверяемого плана. */
function service(plan, name) { return plan.find(item => item.name === name); }

test('Четыре сервиса используют API 5001 и одинаковое имя исполнителя', () => {
  const plan = createDevServicePlan({
    PROJECT_TELEGRAM_API_BASE: 'http://127.0.0.1:5000',
    WORKER_RUNNER_ID: 'local-test', RUNNER_ID: 'ошибочный', PYTHON_PATH: 'test-python',
  }, '/workspace');
  assert.deepEqual(plan.map(item => item.name), ['broker', 'api', 'runtime', 'frontend']);
  for (const item of plan) {
    assert.equal(item.env.PROJECT_TELEGRAM_API_BASE, 'http://127.0.0.1:5001');
    assert.equal(item.env.RUNNER_ID, 'local-test');
    assert.equal(item.env.WORKER_RUNNER_ID, 'local-test');
  }
  assert.equal(service(plan, 'broker').command, 'test-python');
  assert.equal(service(plan, 'api').env.BOT_RUNTIME_MODE, 'api');
  assert.equal(service(plan, 'runtime').env.RUNNER_REQUIRE_FENCE, 'true');
  assert.equal(service(plan, 'runtime').args.includes('watch'), false);
  assert.equal(service(plan, 'api').args.includes('watch'), false);
});

test('Изменённые порты согласованы с URL и окружением брокера', () => {
  const plan = createDevServicePlan({
    BACKEND_PORT: '6101', FRONTEND_PORT: '6100', TELETHON_BROKER_URL: 'http://127.0.0.1:8766',
    TELETHON_BROKER_LOCK_FILE: '/persistent/account.lock',
  }, '/workspace');
  assert.equal(service(plan, 'frontend').env.BACKEND_URL, 'http://127.0.0.1:6101');
  assert.equal(service(plan, 'broker').env.TELETHON_BROKER_PORT, '8766');
  assert.equal(service(plan, 'broker').env.TELETHON_BROKER_LOCK_FILE, '/persistent/account.lock');
});

test('Встроенный режим создаёт единственного владельца в runtime без отдельного брокера', () => {
  const plan = createDevServicePlan({ TELETHON_BROKER_MODE: 'embedded',
    TELETHON_BROKER_URL: 'http://127.0.0.1:8766', WORKER_RUNNER_ID: 'shared-owner',
  }, '/workspace');
  assert.deepEqual(plan.map(item => item.name), ['api', 'runtime', 'frontend']);
  const runtime = service(plan, 'runtime');
  assert.equal(runtime.ownsBroker, true);
  assert.equal(runtime.env.TELETHON_BROKER_MODE, 'embedded');
  assert.deepEqual(runtime.args, ['--import', 'tsx', 'server/runner/index.ts']);
  assert.match(runtime.env.TSX_TSCONFIG_PATH, /tsconfig\.node\.json$/);
  assert.equal(runtime.env.TELETHON_BROKER_PORT, '8766');
  assert.equal(runtime.env.TELETHON_BROKER_HOST, '127.0.0.1');
  assert.equal(runtime.env.PROJECT_TELEGRAM_API_BASE, 'http://127.0.0.1:5001');
  for (const item of plan.filter(item => item !== runtime)) {
    assert.equal(item.env.TELETHON_BROKER_MODE, 'external');
    assert.notEqual(item.ownsBroker, true);
  }
});

test('Отдельный режим не разрешает runtime запускать вложенный брокер', () => {
  const plan = createDevServicePlan({ TELETHON_BROKER_MODE: 'external' }, '/workspace');
  assert.equal(service(plan, 'runtime').ownsBroker, false);
  assert.equal(service(plan, 'runtime').env.TELETHON_BROKER_MODE, 'external');
  assert.equal(service(plan, 'runtime').args.includes('--import'), false);
  assert.equal(plan.filter(item => item.name === 'broker').length, 1);
});

test('Ошибки адресов выявляются до запуска процессов', () => {
  for (const env of [
    { BACKEND_PORT: '5000' }, { FRONTEND_PORT: 'не порт' },
    { TELETHON_BROKER_URL: 'http://remote.example:8765' },
    { TELETHON_BROKER_URL: 'http://127.0.0.1:5001' },
    { TELETHON_BROKER_MODE: 'incorrect' },
  ]) assert.throws(() => createDevServicePlan(env, '/workspace'));
});

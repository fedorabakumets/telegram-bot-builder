/** @fileoverview Проверки изоляции секретов встроенного брокера от сгенерированных ботов и Python-хостов. */
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { isManagedTelegramEnvironmentKey, withoutManagedTelegramEnvironment } from './project-telegram-env-policy';
import { buildWorkerBaseEnv } from '../bots/workerBaseEnv';
import { canShareServerEnv } from '../bots/botEnvPolicy';
import { childEnvironment } from '../runner/polling/pythonChildSupport';
import { startPythonPollingChild } from '../runner/polling/pythonChild';
import { SharedPythonTransport } from '../runner/polling/sharedTransport';

/** Синтетическое окружение исполнителя, не содержащее настоящих реквизитов. */
const runtimeEnvironment = {
  PATH: 'synthetic-python-path',
  TELETHON_BROKER_SECRET: 'synthetic-broker-secret',
  TELETHON_BROKER_URL: 'http://synthetic-private-broker',
  TELETHON_BROKER_MODE: 'embedded',
  TELETHON_BROKER_LOCK_FILE: '/synthetic/broker.lock',
  PROJECT_TELEGRAM_RUNNER_SECRET: 'synthetic-master-signing-secret',
  PROJECT_TELEGRAM_RUNNER_KEY: 'synthetic-other-bot-key',
  PROJECT_TELEGRAM_ACCOUNT_ID: '99',
  PROJECT_TELEGRAM_API_BASE: 'http://synthetic-api',
  DATABASE_URL: 'synthetic-database-connection',
  REDIS_URL: 'synthetic-redis-connection',
};

test('служебное окружение нельзя выдать боту через passthrough или ссылки', () => {
  const names = Object.keys(runtimeEnvironment).filter(name => name !== 'PATH');
  for (const name of names) assert.equal(canShareServerEnv(name, names), false, name);
  assert.deepEqual(buildWorkerBaseEnv(runtimeEnvironment, { passthrough: names }), { PATH: runtimeEnvironment.PATH });
  assert.deepEqual(childEnvironment(runtimeEnvironment), { PATH: runtimeEnvironment.PATH });
});

test('пользовательская подмена параметров брокера удаляется до выпуска ключа бота', () => {
  const userVariables = Object.entries(runtimeEnvironment).filter(([key]) => key !== 'PATH')
    .map(([key, value]) => ({ key, value }));
  const filtered = withoutManagedTelegramEnvironment([
    ...userVariables, { key: 'telethon_broker_secret', value: 'synthetic-lowercase-override' },
    { key: 'project_telegram_runner_secret', value: 'synthetic-lowercase-master' },
    { key: 'CUSTOM_SETTING', value: 'allowed' },
  ]);
  assert.deepEqual(filtered.map(item => item.key), ['DATABASE_URL', 'REDIS_URL', 'CUSTOM_SETTING']);
  /** Только сервер после фильтрации вправе добавить ключ конкретного аккаунта и поколения. */
  filtered.push({ key: 'PROJECT_TELEGRAM_RUNNER_KEY', value: 'synthetic-issued-bot-key' });
  assert.equal(filtered[filtered.length - 1].value, 'synthetic-issued-bot-key');
  assert.equal(isManagedTelegramEnvironmentKey('TELETHON_BROKER_FUTURE_SETTING'), true);
});

test('настоящие дочерние процессы изолированного и общего хоста не видят реквизиты брокера', async () => {
  /** Синтетический Node-процесс воспроизводит протокол Python без Telegram и внешних подключений. */
  const fixture = `const rl=require('node:readline').createInterface({input:process.stdin});
    rl.on('line',line=>{const x=JSON.parse(line);if(x.cmd==='stop'||x.cmd==='shutdown')process.exit(0);
    console.log(JSON.stringify({type:'process',event:'ready',pid:process.pid,
      leaked:Object.keys(process.env).some(k=>/^(TELETHON_BROKER_|PROJECT_TELEGRAM_)/i.test(k))}));});`;
  const env = { ...runtimeEnvironment, PATH: process.env.PATH, SystemRoot: process.env.SystemRoot };
  const events: Record<string, unknown>[] = [];
  const isolated = await startPythonPollingChild({ command: process.execPath, args: ['-e', fixture], env,
    init: {}, onEvent: event => events.push(event), readyTimeoutMs: 2000, stopTimeoutMs: 500 });
  try { assert.equal(events[0].leaked, false); } finally { await isolated.stop(); }
  events.length = 0;
  const shared = new SharedPythonTransport({ command: process.execPath, args: ['-e', fixture], env,
    onEvent: event => events.push(event) });
  try { await shared.ready; assert.equal(events[0].leaked, false); } finally { await shared.shutdown(); }
});

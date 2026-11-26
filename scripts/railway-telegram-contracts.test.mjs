/** @fileoverview Офлайн-проверки рисков развёртывания общего Telegram-клиента через настоящий SDK Railway. */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createRailwayContext } from 'railway/iac';
import program from '../.railway/railway.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const graph = await program(createRailwayContext({ environment: 'offline-contract-test' }));
/** Находит сервис в вычисленном IaC без обращений к Railway или чтения секретов. */
const service = name => {
  const result = graph.resources.find(resource => resource.type === 'service' && resource.name === name);
  assert.ok(result, `Не найден сервис ${name}`);
  return result;
};
/** Возвращает только значение литерала; секреты и ссылки остаются описаниями SDK. */
const literal = (resource, key) => resource.variables[key]?.value;

test('брокер доступен приватной сети, но не публикует API сессий в интернет', () => {
  const broker = service('telegram-accounts');
  assert.equal(literal(broker, 'TELETHON_BROKER_HOST'), '::');
  assert.equal(literal(broker, 'TELETHON_BROKER_ALLOW_PRIVATE_NETWORK'), '1');
  assert.ok(broker.networking.privateNetworkEndpoint);
  for (const key of ['serviceDomains', 'customDomains', 'tcpProxies']) {
    assert.equal(Object.values(broker.networking[key] ?? {}).filter(Boolean).length, 0,
      `Приватный брокер не должен публиковать ${key}`);
  }
  assert.equal(broker.deploy.healthcheckPath, '/healthz');
});

test('развёртывание не создаёт параллельные клиенты одной сессии и даёт время закрыться', () => {
  const broker = service('telegram-accounts');
  const regions = Object.values(broker.deploy.multiRegionConfig);
  assert.equal(regions.reduce((total, region) => total + region.numReplicas, 0), 1);
  assert.equal(broker.deploy.overlapSeconds, 0);
  assert.ok(broker.deploy.drainingSeconds >= 65, 'Нужны 55 секунд операции и 10 секунд отключения');
  const mounts = Object.values(broker.volumeAttachments);
  assert.equal(mounts.length, 1);
  const mount = mounts[0].mountPath;
  assert.ok(literal(broker, 'TELETHON_BROKER_LOCK_FILE').startsWith(`${mount}/`));
});

test('runtime обращается к API, а секрет брокера не передаётся исполнителю', () => {
  const backend = service('bot builder backend');
  const runtime = service('bot runtime');
  const broker = service('telegram-accounts');
  assert.match(literal(backend, 'TELETHON_BROKER_URL'), /telegram-accounts\.RAILWAY_PRIVATE_DOMAIN/);
  assert.match(literal(backend, 'PROJECT_TELEGRAM_API_BASE'), /bot builder backend\.RAILWAY_PRIVATE_DOMAIN/);
  assert.equal(literal(runtime, 'PROJECT_TELEGRAM_API_BASE'), literal(backend, 'PROJECT_TELEGRAM_API_BASE'));
  assert.equal(runtime.variables.TELETHON_BROKER_SECRET, undefined);
  assert.equal(runtime.variables.PROJECT_TELEGRAM_RUNNER_SECRET, undefined);
  assert.notEqual(broker.variables.TELETHON_BROKER_SECRET?.type, 'literal');
  assert.ok(broker.variables.TELETHON_BROKER_SECRET, 'Сервису нужен секрет API → брокер');
  assert.equal(broker.variables.TELETHON_BROKER_SECRET.resource, 'service.bot builder backend');
  assert.equal(broker.variables.TELETHON_BROKER_SECRET.output, 'TELETHON_BROKER_SECRET');
  assert.ok(broker.variables.REDIS_URL, 'Брокеру нужен общий реестр владения');
  assert.equal(broker.variables.REDIS_URL.resource, 'database.Redis');
  assert.ok(backend.variables.PROJECT_TELEGRAM_ACCOUNT_CUTOVER_ENABLED,
    'IaC должен сохранять реальный флаг управляемого переноса аккаунтов');
  assert.equal(backend.variables.PROJECT_TELEGRAM_CUTOVER_ENABLED, undefined,
    'Ошибочное имя флага оставит перенос выключенным после изменения окружения');
});

test('изменения брокера и зависимостей пересобирают его образ', () => {
  const broker = service('telegram-accounts');
  assert.ok(existsSync(resolve(root, broker.build.dockerfilePath)));
  const watched = broker.build.watchPatterns;
  assert.ok(watched.some(pattern => pattern.startsWith('/server/python/')));
  assert.ok(watched.includes('/requirements.txt'));
  assert.ok(watched.includes(`/${broker.build.dockerfilePath}`));
  const docker = readFileSync(resolve(root, broker.build.dockerfilePath), 'utf8');
  assert.match(docker, /telethon_account_broker\.py/);
  assert.match(docker, /telethon_broker_\*\.py/);
  assert.doesNotMatch(docker, /^\s*(?:COPY|ADD)\s+\.\s/gmi, 'Образ брокера не должен захватывать весь рабочий каталог с секретами');
});

test('новый root-owned том подготавливается до запуска Python без root-привилегий', () => {
  const broker = service('telegram-accounts');
  const docker = readFileSync(resolve(root, broker.build.dockerfilePath), 'utf8');
  const command = docker.match(/^CMD (\[.*\])$/m);
  assert.ok(command, 'Нужна явная стартовая команда образа');
  const startup = JSON.parse(command[1]).join(' ');
  assert.match(startup, /chown.*10001:10001/);
  assert.match(startup, /exec gosu 10001:10001 python/);
  assert.match(docker, /ENTRYPOINT \["\/usr\/bin\/tini", "--"\]/);
  assert.ok(!broker.deploy.startCommand, 'Railway startCommand не должен обходить подготовку смонтированного тома');
});

test('добавление брокера сохраняет плановое обслуживание PostgreSQL без публикации реквизитов', () => {
  const cleaner = service('postgres-cache-cleaner');
  assert.ok(cleaner.deploy.cronSchedule, 'Существующее задание не должно превратиться в постоянный процесс');
  assert.equal(cleaner.deploy.restartPolicyType, 'NEVER', 'Ошибка обслуживания не должна создать бесконечный цикл запросов');
  for (const key of ['PGHOST', 'PGPORT', 'PGUSER', 'PGPASSWORD', 'PGDATABASE']) {
    assert.equal(cleaner.variables[key]?.type, 'preserve', `${key} должен оставаться на стороне Railway`);
  }
});

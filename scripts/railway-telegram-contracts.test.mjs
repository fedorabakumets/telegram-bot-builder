/** @fileoverview Офлайн-проверки рисков развёртывания общего Telegram-клиента через настоящий SDK Railway. */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createRailwayContext } from 'railway/iac';
import program, { railwayForTopology } from '../.railway/railway.ts';
import { telegramBrokerTopology } from '../.railway/telegram-broker-topology.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const graph = await program(createRailwayContext({ environment: 'offline-contract-test' }));
const standalone = await railwayForTopology('standalone')(createRailwayContext({ environment: 'offline-contract-test' }));
const embedded = await railwayForTopology('embedded')(createRailwayContext({ environment: 'offline-contract-test' }));
/** Находит сервис в вычисленном IaC без обращений к Railway или чтения секретов. */
const service = (name, project = graph) => {
  const result = project.resources.find(resource => resource.type === 'service' && resource.name === name);
  assert.ok(result, `Не найден сервис ${name}`);
  return result;
};
/** Возвращает только значение литерала; секреты и ссылки остаются описаниями SDK. */
const literal = (resource, key) => resource.variables[key]?.value;

test('по умолчанию сохраняется отдельный брокер, ошибочный выбор не маскируется запасным режимом', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(graph)), JSON.parse(JSON.stringify(standalone)));
  assert.throws(() => telegramBrokerTopology('external-typo'), /топология/i);
  assert.equal(literal(service('bot runtime'), 'TELETHON_BROKER_MODE'), 'external');
  assert.equal(service('bot runtime').variables.PORT, undefined);
  assert.equal(service('bot runtime').deploy.healthcheckPath, undefined);
});

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

test('встроенный режим оставляет три прикладных сервиса и ровно одного владельца постоянного тома', () => {
  const application = embedded.resources.filter(resource => resource.type === 'service'
    && ['bot runtime', 'bot builder backend', 'bot builder frontend', 'telegram-accounts'].includes(resource.name));
  assert.equal(application.length, 3);
  assert.equal(embedded.resources.some(resource => resource.name === 'telegram-accounts'), false);
  const runtime = service('bot runtime', embedded);
  assert.equal(literal(runtime, 'TELETHON_BROKER_MODE'), 'embedded');
  assert.equal(Object.values(runtime.deploy.multiRegionConfig).reduce((sum, region) => sum + region.numReplicas, 0), 1);
  assert.equal(runtime.deploy.overlapSeconds, 0);
  assert.ok(runtime.deploy.drainingSeconds >= 75, 'Время остановки включает worker и отключение Telethon');
  const mounts = application.flatMap(resource => Object.values(resource.volumeAttachments ?? {}))
    .filter(mount => mount.volume === 'volume.telegram-accounts-volume');
  assert.equal(mounts.length, 1, 'Том нельзя одновременно выдавать runtime и отдельному брокеру');
  assert.ok(literal(runtime, 'TELETHON_BROKER_LOCK_FILE').startsWith(`${mounts[0].mountPath}/`));
});

test('встроенный режим направляет API к runtime и выдаёт секрет только контейнеру владельца', () => {
  const runtime = service('bot runtime', embedded);
  const backend = service('bot builder backend', embedded);
  assert.match(literal(backend, 'TELETHON_BROKER_URL'), /bot runtime\.RAILWAY_PRIVATE_DOMAIN.*:8765$/);
  assert.doesNotMatch(literal(backend, 'TELETHON_BROKER_URL'), /telegram-accounts\.RAILWAY_PRIVATE_DOMAIN/);
  assert.equal(runtime.variables.TELETHON_BROKER_SECRET?.type, 'reference');
  assert.equal(runtime.variables.TELETHON_BROKER_SECRET.resource, 'service.bot builder backend');
  assert.equal(runtime.variables.PROJECT_TELEGRAM_RUNNER_SECRET, undefined);
  assert.equal(service('bot builder frontend', embedded).variables.TELETHON_BROKER_SECRET, undefined);
  assert.equal(literal(runtime, 'TELETHON_BROKER_HOST'), '::');
  assert.equal(literal(runtime, 'TELETHON_BROKER_ALLOW_PRIVATE_NETWORK'), '1');
  assert.equal(literal(runtime, 'PORT'), '8765', 'Railway проверяет готовность встроенного владельца на порту брокера');
  assert.equal(literal(runtime, 'RUNNER_WEBHOOK_PORT'), '9080', 'Внутренняя доставка webhook сохраняет собственный порт');
  assert.equal(runtime.deploy.healthcheckPath, '/healthz');
  assert.ok(runtime.deploy.healthcheckTimeout >= 90);
  for (const key of ['serviceDomains', 'customDomains', 'tcpProxies']) {
    assert.equal(Object.values(runtime.networking[key] ?? {}).filter(Boolean).length, 0);
  }
});

test('образ общего runtime сохраняет подготовку тома даже при startCommand Railway', () => {
  const runtime = service('bot runtime', embedded);
  const docker = readFileSync(resolve(root, runtime.build.dockerfilePath), 'utf8');
  assert.match(docker, /COPY server\/python \.\/python/);
  const entry = docker.match(/^ENTRYPOINT (\[.*\])$/m);
  assert.ok(entry, 'Встроенному владельцу нужен entrypoint, не обходящий подготовку тома');
  const command = JSON.parse(entry[1]);
  assert.deepEqual(command.slice(0, 3), ['/usr/bin/tini', '--', 'sh']);
  const scriptName = command[3].split('/').pop();
  assert.match(docker, new RegExp(`COPY server/runner/${scriptName.replaceAll('.', '\\.')} `));
  const init = readFileSync(resolve(root, 'server/runner', scriptName), 'utf8');
  assert.match(init, /chown -R.*\/var\/lib\/botcraft-telegram/);
  assert.match(init, /exec gosu.*"\$@"/);
  assert.ok(runtime.build.watchPatterns.some(pattern => pattern.startsWith('/server/runner/')));
});

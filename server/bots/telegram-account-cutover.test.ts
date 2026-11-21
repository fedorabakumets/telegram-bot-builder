/** @fileoverview Проверки возобновления переноса и отката без Telegram и PostgreSQL. */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { EventEmitter } from 'node:events';
import { rollbackTelegramAccountCutover, runTelegramAccountCutover } from './telegram-account-cutover';
import { isTelegramAccountCutoverAvailable, telegramCutoverConfigurationReason } from './telegram-account-cutover-availability';
import { confirmCutoverWorkerExit } from './confirm-cutover-worker-exit';
import type {
  TelegramAccountCutoverJournal, TelegramAccountCutoverPhase, TelegramAccountCutoverRuntime,
} from './telegram-account-cutover-types';

const plan = { id: 'test-cutover', projectId: 4, accountId: 17, botIds: [3, 2, 2] };

/**
 * Даёт журнал с сохранением фазы между вызовами и контролируемые действия среды.
 * @param initialPhase - Начальная фаза после условного сбоя.
 * @returns Тестовая среда и очередь действий.
 */
function createFixture(initialPhase: TelegramAccountCutoverPhase = 'prepared') {
  let phase = initialPhase;
  const events: string[] = [];
  const journal: TelegramAccountCutoverJournal = {
    async exclusive(input, mode, work) {
      assert.deepEqual(input.botIds, [2, 3]);
      events.push(mode);
      return work({
        get phase() { return phase; },
        fence: 'test-fence',
        async advance(next) { events.push(next); phase = next; },
      });
    },
  };
  const runtime: TelegramAccountCutoverRuntime = {
    async quiesceLegacy(execution) {
      assert.equal(execution.fence, 'test-fence');
      events.push('legacy-check');
      return [2, 3];
    },
    async installSharedBindings() { events.push('shared-bind'); },
    async startShared() { events.push('shared-start'); return true; },
    async quiesceShared() { events.push('shared-check'); return true; },
    async restoreLegacyBindings() { events.push('legacy-bind'); },
    async restoreLegacyRuntime() { events.push('legacy-start'); return true; },
  };
  return { journal, runtime, events, get phase() { return phase; } };
}

describe('Перенос Telegram-аккаунта', () => {
  it('подтверждает остановку каждого старого клиента до установки и запуска', async () => {
    const fixture = createFixture();
    assert.equal(await runTelegramAccountCutover(plan, fixture.journal, fixture.runtime), 'shared-ready');
    assert.deepEqual(fixture.events, [
      'cutover', 'legacy-check', 'legacy-stopped', 'shared-bind', 'shared-installed', 'shared-start', 'shared-ready',
    ]);
    fixture.events.length = 0;
    assert.equal(await runTelegramAccountCutover(plan, fixture.journal, fixture.runtime), 'shared-ready');
    assert.deepEqual(fixture.events, ['cutover']);
  });

  it('останавливается на неподтверждённом или неожиданном идентификаторе', async () => {
    const fixture = createFixture();
    fixture.runtime.quiesceLegacy = async () => [2, 99];
    await assert.rejects(runTelegramAccountCutover(plan, fixture.journal, fixture.runtime), { code: 'legacyUnconfirmed' });
    assert.equal(fixture.phase, 'prepared');
    assert.deepEqual(fixture.events, ['cutover']);
  });

  it('повторяет только неподтверждённый запуск после сбоя транспорта', async () => {
    const fixture = createFixture('shared-installed');
    fixture.runtime.startShared = async () => { throw new Error('private-test-detail'); };
    await assert.rejects(runTelegramAccountCutover(plan, fixture.journal, fixture.runtime), error => {
      assert.equal((error as Error).message.includes('private-test-detail'), false);
      return true;
    });
    assert.equal(fixture.phase, 'shared-installed');
    fixture.runtime.startShared = async () => true;
    assert.equal(await runTelegramAccountCutover(plan, fixture.journal, fixture.runtime), 'shared-ready');
    assert.deepEqual(fixture.events, ['cutover', 'cutover', 'shared-ready']);
  });

  it('сохраняет решение об откате и ждёт подтверждения отключения общего клиента', async () => {
    const fixture = createFixture('shared-ready');
    const accept = fixture.runtime.quiesceShared;
    fixture.runtime.quiesceShared = async () => false;
    await assert.rejects(rollbackTelegramAccountCutover(plan, fixture.journal, fixture.runtime), { code: 'sharedUnconfirmed' });
    assert.equal(fixture.phase, 'rollback-started');
    await assert.rejects(runTelegramAccountCutover(plan, fixture.journal, fixture.runtime), { code: 'invalidPhase' });
    fixture.runtime.quiesceShared = accept;
    assert.equal(await rollbackTelegramAccountCutover(plan, fixture.journal, fixture.runtime), 'rolled-back');
    assert.deepEqual(fixture.events, [
      'rollback', 'rollback-started', 'cutover', 'rollback', 'shared-check', 'shared-stopped',
      'legacy-bind', 'legacy-restored', 'legacy-start', 'rolled-back',
    ]);
  });

  it('не объявляет откат завершённым при неподтверждённом запуске старых клиентов', async () => {
    const fixture = createFixture('shared-stopped');
    fixture.runtime.restoreLegacyRuntime = async () => false;
    await assert.rejects(rollbackTelegramAccountCutover(plan, fixture.journal, fixture.runtime), { code: 'legacyNotRestored' });
    assert.equal(fixture.phase, 'legacy-restored');
    assert.deepEqual(fixture.events, ['rollback', 'legacy-bind', 'legacy-restored']);
  });

  it('разрешает конфигурации с проверяемым транспортом и отклоняет несовместимые режимы', () => {
    const combined = {
      PROJECT_TELEGRAM_ACCOUNT_CUTOVER_ENABLED: '1',
      WORKER_RUNTIME: 'process',
      TELETHON_BROKER_URL: 'http://broker.invalid',
      TELETHON_BROKER_SECRET: 'synthetic-test-value-only-for-local-checks',
    };
    assert.equal(isTelegramAccountCutoverAvailable(combined), true);
    assert.equal(isTelegramAccountCutoverAvailable({ ...combined, WORKER_RUNTIME: 'docker' }), true);
    assert.equal(isTelegramAccountCutoverAvailable({ ...combined, WORKER_GROUPING: 'shared' }), true);
    assert.equal(isTelegramAccountCutoverAvailable({ ...combined, BOT_RUNTIME_MODE: 'api', WORKER_RUNTIME: 'remote',
      REDIS_URL: 'redis://example.invalid' }), true);
    assert.equal(isTelegramAccountCutoverAvailable({ ...combined, BOT_RUNTIME_MODE: 'api', WORKER_RUNTIME: 'remote' }), false);
    assert.equal(isTelegramAccountCutoverAvailable({ ...combined, WORKER_RUNTIME: 'remote' }), false);
    assert.equal(isTelegramAccountCutoverAvailable({ ...combined, BOT_RUNTIME_MODE: 'combined',
      WORKER_RUNTIME: 'remote', REDIS_URL: 'redis://example.invalid' }), true);
    assert.equal(isTelegramAccountCutoverAvailable({ ...combined, USE_WORKER_POOL: 'false' }), false);
    assert.equal(telegramCutoverConfigurationReason({ ...combined, WORKER_GROUPING: 'unknown' }), 'unsupported-runtime');
    assert.equal(telegramCutoverConfigurationReason({ ...combined, TELETHON_BROKER_URL: '' }), 'broker-unconfigured');
    assert.equal(telegramCutoverConfigurationReason({ ...combined, PROJECT_TELEGRAM_ACCOUNT_CUTOVER_ENABLED: '' }), 'disabled');
    assert.equal(isTelegramAccountCutoverAvailable({ ...combined, PROJECT_TELEGRAM_ACCOUNT_CUTOVER_ENABLED: '' }), false);
  });

  it('не считает завершение задачи либо запрос SIGKILL доказательством выхода процесса', async () => {
    const channel = Object.assign(new EventEmitter(), { pid: 12, send: () => true, kill: () => {} });
    assert.equal(await confirmCutoverWorkerExit(channel, () => channel.emit('bot-stopped'), 5), false);
    assert.equal(await confirmCutoverWorkerExit(channel, () => channel.emit('exit'), 5), true);
  });
});

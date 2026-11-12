/** @fileoverview Проверки различий выбранного и подтверждённого режима административного списка. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { toWorkerBotRuntimeRow, type WorkerBotModeRecord } from './worker-bot-mode-model';

/** Создаёт безопасную запись без настоящих реквизитов бота. */
function record(changes: Partial<WorkerBotModeRecord> = {}): WorkerBotModeRecord {
  return { tokenId: 7, projectId: 8, projectName: 'Проект', botName: 'Бот', botUsername: null,
    launchMode: 'polling', status: 'running', desiredStatus: 'running', configuredMode: null, ...changes };
}

test('Не подменяет неизвестный фактический режим выбранным', () => {
  const row = toWorkerBotRuntimeRow(record(), undefined, { BOT_POLLING_MODE: 'process' });
  assert.equal(row.effectiveMode, 'process');
  assert.equal(row.actualMode, null);
  assert.equal(row.restartRequired, null);
  assert.equal(row.activity, 'unknown');
});

test('Собственный режим важнее общего; подтверждённое различие требует перезапуска', () => {
  const row = toWorkerBotRuntimeRow(record({ configuredMode: 'direct' }),
    { mode: 'process', activity: 'sleeping', running: true, workerKey: 0 }, { BOT_POLLING_MODE: 'process' });
  assert.equal(row.effectiveMode, 'direct');
  assert.equal(row.source, 'bot');
  assert.equal(row.restartRequired, true);
  assert.equal(row.activity, 'sleeping');
});

test('Остановленный бот не требует перезапуска', () => {
  assert.equal(toWorkerBotRuntimeRow(record({ status: 'stopped' }), undefined, {}).restartRequired, false);
});

test('Отправленная команда ещё не подтверждает фактический запуск', () => {
  const row = toWorkerBotRuntimeRow(record(),
    { mode: 'process', activity: 'starting', workerKey: 0, running: false }, {});
  assert.equal(row.actualMode, null);
  assert.equal(row.activity, 'starting');
  assert.equal(row.restartRequired, false);
});

test('Исключённый из общего списка бот получает direct', () => {
  const row = toWorkerBotRuntimeRow(record(), undefined,
    { BOT_POLLING_MODE: 'process', BOT_ON_DEMAND_TOKEN_IDS: '8,9' });
  assert.equal(row.effectiveMode, 'direct');
  assert.equal(row.configuredMode, null);
});

test('Вебхук с выбранным сном показывает несовместимость', () => {
  const row = toWorkerBotRuntimeRow(record({ launchMode: 'webhook', configuredMode: 'ondemand' }), undefined, {});
  assert.equal(row.transportCompatible, false);
});

test('Повреждённая собственная настройка не маскируется наследованием', () => {
  const row = toWorkerBotRuntimeRow(record({ configuredMode: 'invalid' }),
    { mode: 'process', workerKey: 0, activity: 'sleeping', running: true }, { BOT_POLLING_MODE: 'direct' });
  assert.equal(row.source, 'bot');
  assert.equal(row.effectiveMode, null);
  assert.equal(row.configurationError, 'Некорректный режим бота');
  assert.equal(row.actualMode, 'process');
  assert.equal(row.restartRequired, null);
});

test('Повреждённый общий режим не прерывает построение строки', () => {
  const row = toWorkerBotRuntimeRow(record(), undefined, { BOT_POLLING_MODE: 'invalid' });
  assert.equal(row.effectiveMode, null);
  assert.equal(row.configurationError, 'Некорректный общий режим');
});

/** @fileoverview Проверяет отделение предупреждений от служебной причины смерти обработчика. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isBotDiagnosticError, parseWorkerHostCrash } from './workerBotDiagnostics';

test('уровень WARNING не становится причиной остановки даже со словом Error', () => {
  assert.equal(isBotDiagnosticError('Temporary Error, повторяем запрос', 'WARNING'), false);
  assert.equal(isBotDiagnosticError('Не удалось обработать обновление', 'ERROR'), true);
  assert.equal(isBotDiagnosticError('Проблема в сценарии', 50), true);
  assert.equal(isBotDiagnosticError('Предупреждение', 30), false);
});

test('старый DeepLink fallback и явные предупреждения не подменяют ошибку', () => {
  assert.equal(isBotDiagnosticError('[13:52:14] 🔗 [DeepLink] Параметр torlinkbot не распознан — fallback'), false);
  assert.equal(isBotDiagnosticError('[13:52:14] WARNING: соединение переподключается'), false);
  assert.equal(isBotDiagnosticError('Traceback (most recent call last):'), true);
  assert.equal(isBotDiagnosticError('Ошибка конфигурации: не найден модуль'), true);
});

test('причина общего процесса содержит код, сигнал и безопасные счётчики', () => {
  const reason = parseWorkerHostCrash({ type: 'worker_host_crash', exit_code: null, signal: 'SIGKILL',
    diagnostics: { memoryCurrentBytes: 349000000, memoryMaxBytes: 349999104, oomKillCount: 2, oomKillDelta: 1,
      token: 'не должно попадать в ошибку' } });
  assert.match(reason!, /^\[worker_host_crash\] Общий обработчик завершился: code=null, signal=SIGKILL/);
  assert.match(reason!, /oomKillDelta=1/);
  assert.doesNotMatch(reason!, /token|не должно/);
});

test('строка stderr и некорректные поля не выдаются за служебную причину', () => {
  assert.equal(parseWorkerHostCrash({ type: 'stderr', exit_code: 1, signal: null }), undefined);
  assert.equal(parseWorkerHostCrash({ type: 'worker_host_crash', exit_code: '1', signal: null }), undefined);
  assert.equal(parseWorkerHostCrash({ type: 'worker_host_crash', exit_code: 1, signal: 'secret-token' }), undefined);
  assert.equal(parseWorkerHostCrash({ type: 'worker_host_crash', exit_code: 1, signal: null })?.includes('code=1'), true);
});

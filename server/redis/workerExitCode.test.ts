/** @fileoverview Регрессии передачи неизвестного кода и сигнала завершения воркера. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeWorkerExitCode, encodeWorkerExitCode } from './workerExitCode';
import { encodeFields, decodeFields } from './workerStreams';
import { isUnexpectedBotExit } from '../bots/isUnexpectedBotExit';
import { HOST_CRASH_PREFIX, resolveWorkerExitError } from '../bots/workerExitDiagnostic';

test('смерть по SIGKILL сохраняет отсутствие кода после Redis', () => {
  const fields = decodeFields(encodeFields({ c: encodeWorkerExitCode(null), s: 'SIGKILL' }));
  assert.equal(fields.c, undefined);
  assert.equal(decodeWorkerExitCode(fields.c), null);
  assert.equal(fields.s, 'SIGKILL');
});

test('коды 0, 1 и 137 проходят круг передачи без изменения', () => {
  for (const code of [0, 1, 137, -1]) {
    assert.equal(decodeWorkerExitCode(encodeWorkerExitCode(code)), code);
  }
});

test('старое null и повреждённые коды остаются неизвестными, а не NaN или 0', () => {
  for (const raw of [undefined, null, 'null', 'NaN', '', ' ', 'Infinity', '1.5', '0x10', '1e2', '2147483648', {}, 0]) {
    assert.equal(decodeWorkerExitCode(raw), null);
  }
  for (const code of [NaN, Infinity, 0.5, 2_147_483_648]) {
    assert.equal(encodeWorkerExitCode(code), undefined);
  }
});

test('неожиданный сигнал допускает восстановление и сохраняет доверенную OOM-диагностику', () => {
  const code = decodeWorkerExitCode('null');
  const context = { tokenId: 7, exitStatus: String(code), intentionalWorkerKill: false,
    serverShuttingDown: false, expectedStop: false };
  assert.equal(isUnexpectedBotExit(context), true);
  assert.equal(isUnexpectedBotExit({ ...context, expectedStop: true }), false);
  assert.equal(isUnexpectedBotExit({ ...context, serverShuttingDown: true }), false);
  const reason = `${HOST_CRASH_PREFIX}code=null, signal=SIGKILL, oomKillDelta=1`;
  assert.equal(resolveWorkerExitError(String(code), reason, true), reason);
  assert.equal(resolveWorkerExitError('stopped', reason, true), null);
});

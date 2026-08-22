/**
 * @fileoverview Тесты классификации неожиданного выхода из WorkerPool
 * @module server/bots/isUnexpectedBotExit.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isUnexpectedBotExit } from './isUnexpectedBotExit';

const base = {
  tokenId: 7,
  intentionalWorkerKill: false,
  serverShuttingDown: false,
  expectedStop: false,
};

describe('isUnexpectedBotExit', () => {
  it('shutdown сервера — не рестартим', () => {
    assert.strictEqual(
      isUnexpectedBotExit({ ...base, exitStatus: 'null', serverShuttingDown: true }),
      false,
    );
  });

  it('ожидаемый стоп (кнопка) — не рестартим', () => {
    assert.strictEqual(
      isUnexpectedBotExit({ ...base, exitStatus: 'stopped', expectedStop: true }),
      false,
    );
    assert.strictEqual(
      isUnexpectedBotExit({ ...base, exitStatus: 'null', expectedStop: true }),
      false,
    );
  });

  it('намеренный killWorker — не рестартим', () => {
    assert.strictEqual(
      isUnexpectedBotExit({
        ...base,
        exitStatus: 'null',
        intentionalWorkerKill: true,
      }),
      false,
    );
  });

  it('OOM / SIGKILL процесса воркера (null) — рестартим', () => {
    assert.strictEqual(
      isUnexpectedBotExit({ ...base, exitStatus: null as unknown as string }),
      true,
    );
    assert.strictEqual(
      isUnexpectedBotExit({ ...base, exitStatus: 'null' }),
      true,
    );
  });

  it('ненулевой код процесса — рестартим', () => {
    assert.strictEqual(isUnexpectedBotExit({ ...base, exitStatus: 1 }), true);
    assert.strictEqual(isUnexpectedBotExit({ ...base, exitStatus: '137' }), true);
  });

  it('error от Python — рестартим', () => {
    assert.strictEqual(
      isUnexpectedBotExit({ ...base, exitStatus: 'error' }),
      true,
    );
  });

  it('штатный stopped / 0 / running — не рестартим', () => {
    assert.strictEqual(
      isUnexpectedBotExit({ ...base, exitStatus: 'stopped' }),
      false,
    );
    assert.strictEqual(isUnexpectedBotExit({ ...base, exitStatus: 0 }), false);
    assert.strictEqual(
      isUnexpectedBotExit({ ...base, exitStatus: 'running' }),
      false,
    );
  });
});

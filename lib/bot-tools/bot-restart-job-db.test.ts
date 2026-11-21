/** @fileoverview Регрессии MCP-контракта фонового массового перезапуска. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { restartAllBotsInDb } from './bot-runtime-db.ts';
import { getBotRestartJobInDb } from './bot-restart-job-db.ts';

test('приём 202 возвращает pending и jobId без ложной сводки успеха', async () => {
  const previous = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ jobId: 'job-1', projectId: 12, status: 'queued' }, { status: 202 });
  try {
    const result = await restartAllBotsInDb(12, { confirm: true });
    assert.equal(result.outcome, 'pending');
    assert.equal('jobId' in result && result.jobId, 'job-1');
    assert.equal('restarted' in result, false);
  } finally { globalThis.fetch = previous; }
});

test('опрос результата не вызывает новый перезапуск', async () => {
  const previous = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    assert.match(String(url), /\/12\/bot\/restart-all\/jobs\/job-1$/);
    assert.notEqual(init?.method, 'POST');
    return Response.json({ jobId: 'job-1', status: 'completed', result: { restarted: 2, failed: 0 } });
  };
  try { assert.equal((await getBotRestartJobInDb(12, 'job-1')).status, 'completed'); }
  finally { globalThis.fetch = previous; }
});

test('без подтверждения запрос не отправляется', async () => {
  const previous = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('Запрос запрещён'); };
  try { assert.ok('error' in await restartAllBotsInDb(12)); }
  finally { globalThis.fetch = previous; }
});

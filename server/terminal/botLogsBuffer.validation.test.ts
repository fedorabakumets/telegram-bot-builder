/**
 * @fileoverview Проверка защиты записи логов от неверных идентификаторов
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../database/db';
import { addToBuffer, flushBuffer, persistLogLine } from './botLogsBuffer';

describe('Проверка идентификаторов логов', () => {
  /** Проверяет, что ошибка БД и ключ процесса передаются как данные, а не строка форматирования. */
  it('использует постоянный шаблон при ошибке сброса буфера', async () => {
    const originalInsert = db.insert;
    const originalError = console.error;
    const originalPoolActive = globalThis.__dbPoolActive;
    const failure = new Error('Ошибка %s %j');
    const calls: unknown[][] = [];
    db.insert = (() => { throw failure; }) as typeof db.insert;
    console.error = (...args: unknown[]) => { calls.push(args); };
    globalThis.__dbPoolActive = true;
    try {
      addToBuffer(27, 47, 'Содержимое %s %j', 'stderr');
      await flushBuffer('27_47');
      assert.deepEqual(calls, [['[BotLogsBuffer] Ошибка сброса буфера для %s:', '27_47', failure]]);
    } finally {
      db.insert = originalInsert;
      console.error = originalError;
      globalThis.__dbPoolActive = originalPoolActive;
    }
  });

  it('не обращается к базе для нулевого проекта и других неверных ID', async () => {
    const original = db.insert;
    let calls = 0;
    (db as any).insert = () => { calls++; throw new Error('Неожиданный запрос'); };
    try {
      for (const [projectId, tokenId] of [[0, 47], [-1, 47], [27, 0], [NaN, 47]]) {
        assert.equal(await persistLogLine(projectId, tokenId, 'тест', 'stdout'), undefined);
        addToBuffer(projectId, tokenId, 'тест', 'stdout');
        await flushBuffer(`${projectId}_${tokenId}`);
      }
      assert.equal(calls, 0);
    } finally {
      (db as any).insert = original;
    }
  });
});

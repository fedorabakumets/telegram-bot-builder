/**
 * @fileoverview Проверка защиты записи логов от неверных идентификаторов
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../database/db';
import { addToBuffer, flushBuffer, persistLogLine } from './botLogsBuffer';

describe('Проверка идентификаторов логов', () => {
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

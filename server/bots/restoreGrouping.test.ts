/**
 * @fileoverview Тесты restoreGrouping
 * @module server/bots/restoreGrouping.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { groupRestoreInstancesByProject, runRestoreProjects, mapRestoreCandidates } from './restoreGrouping';

describe('groupRestoreInstancesByProject', () => {
  it('допускает пять ботов одного проекта, шестой ждёт завершения и результаты упорядочены', async () => {
    const started: number[] = [];
    const release: Array<() => void> = [];
    const input = Array.from({ length: 12 }, (_, index) => index);
    const pending = mapRestoreCandidates(input, async value => {
      started.push(value);
      await new Promise<void>(resolve => { release[value] = resolve; });
      return value * 2;
    });
    assert.deepStrictEqual(started, [0, 1, 2, 3, 4]);
    release[3]();
    await new Promise<void>(resolve => setImmediate(resolve));
    assert.deepStrictEqual(started, [0, 1, 2, 3, 4, 5]);
    // Завершаем в обратном порядке; каждый освобождённый работник берёт ровно одного следующего.
    for (let round = 0; round < 12; round++) {
      for (const resume of release) resume?.();
      await new Promise<void>(resolve => setImmediate(resolve));
    }
    assert.deepStrictEqual(await pending, input.map(value => value * 2));
  });

  it('не ждёт медленный проект перед стартом другого и сохраняет порядок токенов', async () => {
    const calls: number[] = [];
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const instances = [{ id: 1, projectId: 1, tokenId: 11 },
      { id: 2, projectId: 2, tokenId: 21 }, { id: 3, projectId: 1, tokenId: 12 }];
    const pending = runRestoreProjects(instances, async group => {
      // Имитируем медленный первый запуск проекта без реального ожидания таймеров.
      for (const row of group) {
        calls.push(row.tokenId);
        if (row.tokenId === 11) await gate;
      }
      return group.length;
    });
    assert.deepStrictEqual(calls, [11, 21]);
    release();
    assert.deepStrictEqual(await pending, [2, 1]);
    assert.deepStrictEqual(calls, [11, 21, 12]);
  });

  it('группирует по projectId', () => {
    const instances = [
      { id: 1, projectId: 1, tokenId: 2 },
      { id: 2, projectId: 2, tokenId: 1 },
      { id: 3, projectId: 1, tokenId: 3 },
      { id: 4, projectId: 3, tokenId: 7 },
    ];

    const groups = groupRestoreInstancesByProject(instances);
    assert.strictEqual(groups.length, 3);

    const project1 = groups.find((g) => g[0].projectId === 1);
    assert.ok(project1);
    assert.strictEqual(project1.length, 2);
    assert.deepStrictEqual(
      project1.map((i) => i.tokenId),
      [2, 3],
    );
  });

  it('сохраняет порядок внутри группы как в исходном массиве', () => {
    const instances = [
      { id: 10, projectId: 5, tokenId: 8 },
      { id: 11, projectId: 5, tokenId: 2 },
      { id: 12, projectId: 5, tokenId: 3 },
    ];

    const [group] = groupRestoreInstancesByProject(instances);
    assert.deepStrictEqual(
      group.map((i) => i.tokenId),
      [8, 2, 3],
    );
  });

  it('возвращает пустой массив для пустого входа', () => {
    assert.deepStrictEqual(groupRestoreInstancesByProject([]), []);
  });
});

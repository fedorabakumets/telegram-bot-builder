/**
 * @fileoverview Тесты restoreGrouping
 * @module server/bots/restoreGrouping.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { groupRestoreInstancesByProject } from './restoreGrouping';

describe('groupRestoreInstancesByProject', () => {
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

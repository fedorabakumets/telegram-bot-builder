/**
 * @fileoverview Тесты resolveBotPaths
 * @module server/files/createBotFile.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { resolveBotPaths } from './createBotFile';

describe('resolveBotPaths', () => {
  it('формирует папку и mainFile с customFileName', () => {
    const { botDir, mainFile } = resolveBotPaths(3, 7, 'topexchanger');
    assert.ok(botDir.endsWith('topexchanger_3_7'));
    assert.ok(mainFile.endsWith('topexchanger.py'));
  });

  it('формирует стандартные имена без customFileName', () => {
    const { botDir, mainFile } = resolveBotPaths(1, 2);
    assert.ok(botDir.endsWith('bot_1_2'));
    assert.ok(mainFile.endsWith('bot_1_2.py'));
  });
});

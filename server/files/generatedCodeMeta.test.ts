/**
 * @fileoverview Тесты generatedCodeMeta
 * @module server/files/generatedCodeMeta.test
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  GENERATED_CODE_META_FILENAME,
  readGeneratedCodeMeta,
  writeGeneratedCodeMeta,
} from './generatedCodeMeta';

describe('generatedCodeMeta', () => {
  let botDir: string;

  beforeEach(() => {
    botDir = mkdtempSync(join(tmpdir(), 'bot-meta-'));
  });

  afterEach(() => {
    rmSync(botDir, { recursive: true, force: true });
  });

  it('отсутствующий файл → null', () => {
    assert.strictEqual(readGeneratedCodeMeta(botDir), null);
  });

  it('повреждённый JSON → null', () => {
    writeFileSync(join(botDir, GENERATED_CODE_META_FILENAME), '{ broken', 'utf8');
    assert.strictEqual(readGeneratedCodeMeta(botDir), null);
  });

  it('запись и чтение совпадают', () => {
    const meta = {
      fingerprint: 'fp-deadbeef',
      projectId: 1,
      tokenId: 2,
      writtenAt: '2026-08-22T12:00:00.000Z',
    };
    writeGeneratedCodeMeta(botDir, meta);
    assert.deepStrictEqual(readGeneratedCodeMeta(botDir), meta);
  });
});

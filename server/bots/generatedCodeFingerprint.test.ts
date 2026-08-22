/**
 * @fileoverview Тесты generatedCodeFingerprint
 * @module server/bots/generatedCodeFingerprint.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  buildGeneratedCodeFingerprint,
  canReuseGeneratedCode,
  checksumProjectData,
  type GeneratedCodeInput,
} from './generatedCodeFingerprint';

const baseInput: GeneratedCodeInput = {
  projectDataChecksum: 'abc123',
  projectName: 'TorLink',
  userDatabaseEnabled: true,
  saveIncomingMedia: false,
  catchAllHandlers: true,
  protectContent: false,
  contentCache: false,
  generatorVersion: 'gen-v1',
};

describe('checksumProjectData', () => {
  it('одинаковые данные дают одинаковую сумму', () => {
    const data = { sheets: [{ id: 's1', nodes: [] }] };
    assert.strictEqual(
      checksumProjectData(data),
      checksumProjectData(data),
    );
  });

  it('разные данные дают разную сумму', () => {
    assert.notStrictEqual(
      checksumProjectData({ a: 1 }),
      checksumProjectData({ a: 2 }),
    );
  });
});

describe('buildGeneratedCodeFingerprint', () => {
  it('стабилен для одинакового входа', () => {
    const a = buildGeneratedCodeFingerprint(baseInput);
    const b = buildGeneratedCodeFingerprint({ ...baseInput });
    assert.strictEqual(a, b);
  });

  it('меняется при изменении projectDataChecksum', () => {
    const a = buildGeneratedCodeFingerprint(baseInput);
    const b = buildGeneratedCodeFingerprint({
      ...baseInput,
      projectDataChecksum: 'other',
    });
    assert.notStrictEqual(a, b);
  });

  it('меняется при изменении saveIncomingMedia', () => {
    const a = buildGeneratedCodeFingerprint(baseInput);
    const b = buildGeneratedCodeFingerprint({
      ...baseInput,
      saveIncomingMedia: true,
    });
    assert.notStrictEqual(a, b);
  });

  it('меняется при изменении generatorVersion', () => {
    const a = buildGeneratedCodeFingerprint(baseInput);
    const b = buildGeneratedCodeFingerprint({
      ...baseInput,
      generatorVersion: 'gen-v2',
    });
    assert.notStrictEqual(a, b);
  });
});

describe('canReuseGeneratedCode', () => {
  const fp = buildGeneratedCodeFingerprint(baseInput);

  it('true при совпадении и существующем файле', () => {
    assert.strictEqual(canReuseGeneratedCode(fp, fp, true), true);
  });

  it('false без файла', () => {
    assert.strictEqual(canReuseGeneratedCode(fp, fp, false), false);
  });

  it('false без сохранённого отпечатка', () => {
    assert.strictEqual(canReuseGeneratedCode(null, fp, true), false);
  });

  it('false при несовпадении отпечатков', () => {
    assert.strictEqual(canReuseGeneratedCode('old', fp, true), false);
  });
});

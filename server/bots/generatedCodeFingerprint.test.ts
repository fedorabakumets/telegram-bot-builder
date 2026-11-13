/**
 * @fileoverview Тесты generatedCodeFingerprint
 * @module server/bots/generatedCodeFingerprint.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createHash } from 'node:crypto';
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
  trackUserBlocks: true,
  trackGroupMembership: true,
  protectContent: false,
  contentCache: false,
  psqlBuiltinEnabled: false,
  psqlPanelDsnDenied: false,
  botRuntimeRole: false,
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

  it('меняется при отключении отслеживания блокировок', () => {
    assert.notStrictEqual(buildGeneratedCodeFingerprint(baseInput), buildGeneratedCodeFingerprint({
      ...baseInput, trackUserBlocks: false,
    }));
  });

  it('меняется при изменении psqlPanelDsnDenied', () => {
    const a = buildGeneratedCodeFingerprint(baseInput);
    const b = buildGeneratedCodeFingerprint({
      ...baseInput,
      psqlPanelDsnDenied: true,
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

  it('не использует локальную или сохранённую сборку старого протокола', () => {
    const oldFingerprint = createHash('sha256').update(JSON.stringify(baseInput)).digest('hex');
    const fingerprint = buildGeneratedCodeFingerprint(baseInput);
    assert.notStrictEqual(fingerprint, oldFingerprint);
    assert.strictEqual(canReuseGeneratedCode(oldFingerprint, fingerprint, true), false);
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

/** Проверяет обновление только сборок webhook при внедрении индивидуального секрета. */
describe('версия протокола webhook', () => {
  it('отвергает старую сборку для webhook и сохраняет отпечаток polling', () => {
    const oldFingerprint = buildGeneratedCodeFingerprint(baseInput);
    const polling = buildGeneratedCodeFingerprint({ ...baseInput, webhookProtocolVersion: undefined });
    const webhook = buildGeneratedCodeFingerprint({ ...baseInput, webhookProtocolVersion: 1 });
    assert.equal(polling, oldFingerprint);
    assert.equal(canReuseGeneratedCode(oldFingerprint, webhook, true), false);
    assert.equal(canReuseGeneratedCode(webhook, webhook, true), true);
    const webhookSleep = buildGeneratedCodeFingerprint({ ...baseInput, webhookProtocolVersion: 2 });
    assert.equal(canReuseGeneratedCode(webhook, webhookSleep, true), false);
  });
});

/** @fileoverview Проверки локального группирования старых привязок и безопасного повторного запуска. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { confirmLegacyTelegramAccountMerge, planLegacyTelegramAccountMigration } from './legacy-migration-plan';
import { fingerprintLegacyTelegramSession } from './legacy-session-fingerprint';

/**
 * Строит структурно корректную синтетическую строку Telethon без настоящего ключа.
 * @param ipLength - Размер поля IP в байтах.
 * @param keyByte - Значение всех байтов вымышленного ключа.
 * @returns Синтетическая строка для проверок формата.
 */
function fakeSession(ipLength: 4 | 16, keyByte: number): string {
  const bytes = Buffer.alloc(3 + ipLength + 256, keyByte);
  bytes[0] = 2;
  bytes.writeUInt16BE(443, 1 + ipLength);
  return `1${bytes.toString('base64url')}=`;
}

test('отпечаток зависит только от ключа и отклоняет неподдерживаемые строки', () => {
  const first = fakeSession(4, 19);
  const fingerprint = fingerprintLegacyTelegramSession(first);
  assert.match(fingerprint!, /^[a-f0-9]{64}$/);
  assert.equal(fingerprintLegacyTelegramSession(fakeSession(16, 19)), fingerprint);
  assert.notEqual(fingerprintLegacyTelegramSession(fakeSession(4, 42)), fingerprint);
  assert.equal(fingerprintLegacyTelegramSession(fakeSession(4, 0)), null);
  assert.equal(fingerprintLegacyTelegramSession(first.slice(0, -1)), null);
  assert.equal(fingerprintLegacyTelegramSession(`2${first.slice(1)}`), null);
  assert.equal(fingerprintLegacyTelegramSession('••••••••'), null);
});

test('совпадающие ключи группируются в проекте и отсутствуют в ответе', () => {
  const rows = [
    { projectId: 4, botId: 50, name: 'Бот 50', fingerprint: 'opaque-example' },
    { projectId: 4, botId: 42, name: 'Бот 42', fingerprint: 'opaque-example' },
    { projectId: 4, botId: 44, name: 'Бот 44', fingerprint: 'other-session' },
    { projectId: 8, botId: 45, name: 'Чужой бот', fingerprint: 'unrelated-session' },
  ];
  const plan = planLegacyTelegramAccountMigration(4, rows);
  assert.deepEqual(plan.groups.map(group => [group.id, group.botIds, group.disposition]), [
    [42, [42, 50], 'create'], [44, [44], 'create'],
  ]);
  assert.doesNotMatch(JSON.stringify(plan), /opaque-example|other-session|Чужой бот/);
});

test('повторный запуск не переносит уже привязанных ботов и повторно использует подходящий аккаунт', () => {
  const plan = planLegacyTelegramAccountMigration(4, [
    { projectId: 4, botId: 42, name: 'Бот 42', fingerprint: 'same', linkedAccountId: 20 },
    { projectId: 4, botId: 50, name: 'Бот 50', fingerprint: 'same' },
  ], [{ projectId: 4, accountId: 20, fingerprint: 'same' }]);
  assert.deepEqual(plan.excluded, [{ botId: 42, reason: 'already-linked' }]);
  assert.deepEqual(plan.groups.map(group => [group.botIds, group.disposition, group.accountId]), [[[50], 'reuse', 20]]);
});

test('межпроектное совпадение блокируется для старой записи и нового аккаунта', () => {
  const rows = [
    { projectId: 4, botId: 42, name: 'Бот 42', fingerprint: 'old' },
    { projectId: 4, botId: 50, name: 'Бот 50', fingerprint: 'new' },
    { projectId: 8, botId: 60, name: 'Чужой бот', fingerprint: 'old' },
  ];
  const plan = planLegacyTelegramAccountMigration(4, rows, [{ projectId: 8, accountId: 20, fingerprint: 'new' }]);
  assert.deepEqual(plan.groups.map(group => [group.disposition, group.conflict, group.accountId]), [
    ['blocked', 'other-project', undefined], ['blocked', 'other-project', undefined],
  ]);
});

test('разные ключи объединяются только по подтверждённой идентичности и выбору владельца', () => {
  const plan = planLegacyTelegramAccountMigration(4, [
    { projectId: 4, botId: 42, name: 'Бот 42', fingerprint: 'first', verifiedTelegramUserId: '17' },
    { projectId: 4, botId: 50, name: 'Бот 50', fingerprint: 'second', verifiedTelegramUserId: '17' },
    { projectId: 4, botId: 60, name: 'Бот 60', fingerprint: 'third' },
  ]);
  assert.equal(plan.groups.length, 3);
  assert.equal(confirmLegacyTelegramAccountMerge(plan, 42, 50)?.id, 50);
  assert.equal(confirmLegacyTelegramAccountMerge(plan, 42, 60), null);
  assert.equal(confirmLegacyTelegramAccountMerge(plan, 42, 42), null);
});

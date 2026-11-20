/** @fileoverview Проверки явных индивидуальных значений и наследования в пакете настроек. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildBotInheritedSettingsPatch, parseBotInheritedSettingsBatch } from './botInheritedSettingsPatch';

/** Пустой URL и нулевой срок остаются индивидуальными значениями. */
test('различает null, ноль и возврат к наследованию', () => {
  const changes = parseBotInheritedSettingsBatch([
    { action: 'update', key: 'WEBHOOK_BASE_URL', value: '' },
    { action: 'update', key: 'MESSAGES_RETENTION_DAYS', value: '0' },
    { action: 'update', key: 'PROTECT_CONTENT', value: 'false' },
    { action: 'update', key: 'LOG_LEVEL', value: 'inherit' },
  ]);
  const before = ['webhookBaseUrl', 'messagesRetentionDays', 'protectContent', 'trackUserBlocks'];
  assert.deepEqual(buildBotInheritedSettingsPatch(before, changes), {
    webhookBaseUrl: null, messagesRetentionDays: 0, protectContent: 0,
    inheritBotSettings: ['trackUserBlocks', 'logLevel'],
  });
});

/** Невалидный срок и ошибочный URL не попадают в сохранение пакета. */
test('отклоняет повреждённые значения, но сохраняет допустимые флаги старого интерфейса', () => {
  assert.deepEqual(parseBotInheritedSettingsBatch([
    { action: 'update', key: 'SAVE_INCOMING_MEDIA', value: 'true' },
    { action: 'update', key: 'TRACK_GROUP_MEMBERSHIP', value: '1' },
  ]), { saveIncomingMedia: 1, trackGroupMembership: 1 });
  assert.throws(() => parseBotInheritedSettingsBatch([
    { action: 'update', key: 'MESSAGES_RETENTION_DAYS', value: '9' },
  ]), /MESSAGES_RETENTION_DAYS/);
  assert.throws(() => parseBotInheritedSettingsBatch([
    { action: 'update', key: 'WEBHOOK_BASE_URL', value: 'not-a-url' },
  ]), /WEBHOOK_BASE_URL/);
});

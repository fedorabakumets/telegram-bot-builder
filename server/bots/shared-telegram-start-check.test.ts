/** @fileoverview Проверяет защиту обычного запуска без базы и обращений в Telegram. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sharedTelegramStartError } from './shared-telegram-start-check';

test('после изменения сценария блокирует отдельный Telethon-клиент до запуска', async () => {
  const data = { nodes: [{ id: 'direct-client', type: 'code', data: { code: 'TelegramClient()' } }] };
  assert.match((await sharedTelegramStartError(1, 2, data, async () => 3))!, /direct-client/);
  assert.equal(await sharedTelegramStartError(1, 2, data, async () => undefined), undefined);
});

test('разрешает поддерживаемые действия двух ботов одной привязки', async () => {
  const data = { nodes: [{ id: 'text', type: 'userbot_message', data: {} }] };
  for (const token of [2, 4]) assert.equal(await sharedTelegramStartError(1, token, data, async () => 3), undefined);
});

test('разрешает события редактирования через общий брокер', async () => {
  const data = { nodes: [{ id: 'edited', type: 'userbot_edit_trigger', data: {} }] };
  assert.equal(await sharedTelegramStartError(1, 2, data, async () => 3), undefined);
});

test('выключенный общий клиент не импортирует базу и не требует новых таблиц', async () => {
  const previous = process.env.PROJECT_TELEGRAM_ACCOUNTS_ENABLED;
  process.env.PROJECT_TELEGRAM_ACCOUNTS_ENABLED = '0';
  try {
    const data = { nodes: [{ id: 'legacy-event', type: 'userbot_edit_trigger', data: {} }] };
    assert.equal(await sharedTelegramStartError(1, 2, data), undefined);
  } finally {
    if (previous === undefined) delete process.env.PROJECT_TELEGRAM_ACCOUNTS_ENABLED;
    else process.env.PROJECT_TELEGRAM_ACCOUNTS_ENABLED = previous;
  }
});

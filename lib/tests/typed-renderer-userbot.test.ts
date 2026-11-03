/** @fileoverview Проверка передачи признака userbot через общий рендерер. */
import assert from 'node:assert/strict';
import { it } from 'node:test';
import { generateImports, generateMain } from '../templates/typed-renderer';

it('добавляет импорты и запуск userbot при включённом признаке', () => {
  const imports = generateImports({
    userDatabaseEnabled: false, hasInlineButtons: false, hasAutoTransitions: false,
    hasMediaNodes: false, hasUploadImages: false, hasParseModeNodes: false,
    hasMediaGroups: false, hasUrlImages: false, hasDatetimeNodes: false,
    hasTimezoneNodes: false, hasUserbotNodes: true,
  });
  assert.ok(imports.includes('from telethon import TelegramClient'));
  assert.ok(imports.includes('CommandObject'));
  assert.ok(generateMain({ userDatabaseEnabled: false, hasUserbotNodes: true }).includes('await userbot_client.connect()'));
});

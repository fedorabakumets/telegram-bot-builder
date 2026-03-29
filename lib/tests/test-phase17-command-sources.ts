/**
 * @fileoverview Фаза 17 - Источники команд и README
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { generateBotFatherCommands } from '../commands.ts';
import { generateReadme } from '../scaffolding/generateReadme.ts';

function makeProject() {
  const sheet = {
    id: 'sheet1',
    name: 'Лист 1',
    nodes: [
      {
        id: 'trigger-start',
        type: 'command_trigger',
        position: { x: 0, y: 0 },
        data: {
          command: '/start',
          description: 'Запуск',
          showInMenu: true,
        },
      },
      {
        id: 'trigger-help',
        type: 'command_trigger',
        position: { x: 0, y: 0 },
        data: {
          command: '/help',
          description: 'Справка',
          showInMenu: true,
        },
      },
      {
        id: 'legacy-start',
        type: 'start',
        position: { x: 0, y: 0 },
        data: {
          command: '/start',
          description: 'Legacy start',
          showInMenu: true,
        },
      },
      {
        id: 'legacy-command',
        type: 'command',
        position: { x: 0, y: 0 },
        data: {
          command: '/settings',
          description: 'Legacy settings',
          showInMenu: true,
        },
      },
      {
        id: 'message-1',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          messageText: 'Привет!',
          keyboardType: 'none',
          buttons: [],
        },
      },
    ],
    viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    version: 2,
    activeSheetId: sheet.id,
    sheets: [sheet],
  } as any;
}

test('generateBotFatherCommands uses command_trigger only', () => {
  const code = generateBotFatherCommands(makeProject().sheets[0].nodes);

  assert.match(code, /start - Запуск/);
  assert.match(code, /help - Справка/);
  assert.doesNotMatch(code, /Legacy start/);
  assert.doesNotMatch(code, /Legacy settings/);
  assert.equal(code.split('\n').filter(Boolean).length, 2);
});

test('generateReadme uses command_trigger as the command source', () => {
  const readme = generateReadme(makeProject(), 'Demo bot');

  assert.match(readme, /### Команды бота/);
  assert.match(readme, /`\/start` - Запуск/);
  assert.match(readme, /`\/help` - Справка/);
  assert.match(readme, /- \*\*Команд\*\*: 2/);
  assert.match(readme, /- \*\*В меню\*\*: 2/);
  assert.doesNotMatch(readme, /Legacy settings/);
});

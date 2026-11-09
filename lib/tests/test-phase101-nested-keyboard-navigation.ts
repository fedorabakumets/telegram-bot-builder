/**
 * @fileoverview Фаза 101: исходное меню и переход в подменю на сгенерированном Python.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { generatePythonCode } from '../bot-generator';

/** Создаёт узел тестового сценария с меню коннекторов. */
function node(id: string, type: string, data: Record<string, unknown> = {}): any {
  return { id, type, position: { x: 0, y: 0 }, data: { buttons: [], keyboardType: 'none', ...data } };
}

/** Создаёт отдельное или встроенное главное меню, ведущее в самостоятельное подменю. */
function project(binding: 'explicit' | 'graph' | 'embedded', reverse: boolean) {
  const buttons = [
    { id: 'status', text: 'Статус коннектора', action: 'goto', target: 'connectors' },
    { id: 'restart', text: 'Перезагрузить станцию', action: 'goto', target: 'restart' },
  ];
  const greeting = node('greeting', 'message', {
    messageText: 'Здравствуйте',
    ...(binding === 'explicit' ? { keyboardNodeId: 'main_menu' } : {}),
    ...(binding === 'embedded' ? { keyboardType: 'inline', buttons } : {}),
  });
  const menus = [
    ...(binding === 'embedded' ? [] : [node('main_menu', 'keyboard', { keyboardType: 'inline', buttons })]),
    node('connectors', 'keyboard', { keyboardType: 'inline', buttons: [
      { id: 'one', text: 'Коннектор 1', action: 'goto', target: 'one' },
      { id: 'two', text: 'Коннектор 2', action: 'goto', target: 'two' },
    ] }),
  ];
  return {
    nodes: [greeting, ...(reverse ? menus.reverse() : menus),
      node('one', 'message', { messageText: 'Выбран коннектор 1' }),
      node('two', 'message', { messageText: 'Выбран коннектор 2' }),
      node('restart', 'message', { messageText: 'Перезагрузка' })],
    connections: binding === 'graph' ? [{ id: 'binding', source: 'greeting', target: 'main_menu' }] : [],
  };
}

describe('Фаза 101: переход из главного меню в подменю', () => {
  for (const binding of ['explicit', 'graph', 'embedded'] as const) {
    for (const reverse of [false, true]) {
      it(`${binding}, обратный порядок нод=${reverse}: показывает оба меню по очереди`, () => {
        const graph = project(binding, reverse);
        const original = JSON.stringify(graph);
        const code = generatePythonCode(graph, { botName: 'NestedMenus', userDatabaseEnabled: false });
        assert.equal(JSON.stringify(graph), original, 'генерация не меняет сохранённую схему');
        const python = existsSync('.venv/bin/python') ? '.venv/bin/python' : 'python';
        const output = execFileSync(python, [fileURLToPath(new URL('./nested-keyboard-runtime.py', import.meta.url))], {
          input: code, encoding: 'utf8',
        });
        assert.ok(output.includes('OK'));
      });
    }
  }
});

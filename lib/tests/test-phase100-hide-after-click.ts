/**
 * @fileoverview Фаза 100: общее скрытие inline-клавиатуры для любых целевых узлов.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { generatePythonCode } from '../bot-generator';

/** Создаёт узел с минимальными настройками для проверки общей обработки callback. */
function node(id: string, type: string, data: Record<string, unknown> = {}): any {
  return { id, type, position: { x: 0, y: 0 }, data: { buttons: [], keyboardType: 'none', ...data } };
}

/** Создаёт меню, ведущее в разные типы исполняемых блоков. */
function project() {
  const targets = [
    node('target_message', 'message', { messageText: 'Готово' }),
    node('target_condition', 'condition', { variable: 'choice', branches: [{ id: 'else', operator: 'else', target: 'target_message' }] }),
    node('target_set_variable', 'set_variable', { assignments: [] }),
    node('target_delay', 'delay', { seconds: '0' }),
    node('target_http_request', 'http_request', { httpRequestUrl: 'https://example.com' }),
    node('target_edit_message', 'edit_message', { editMode: 'both', editMessageText: 'Выбрано', editKeyboardMode: 'keep' }),
    node('target_delete_message', 'delete_message'),
    node('target_keyboard', 'keyboard'),
    node('target_media', 'media'),
    node('target_code', 'code', { code: 'pass' }),
    node('target_forward_message', 'forward_message'),
    node('target_stop_processing', 'stop_processing'),
    node('target_input', 'input', { inputType: 'text', inputVariable: 'choice' }),
  ];
  const menu = node('menu', 'keyboard', {
    buttons: targets.map(target => ({ id: target.id, text: target.type, action: 'goto', target: target.id, hideAfterClick: true })).concat([
      { id: 'keep', text: 'Оставить', action: 'goto', target: 'target_message', hideAfterClick: false },
      { id: 'custom', text: 'Выбор {item}', action: 'goto', target: 'target_message', hideAfterClick: true, customCallbackData: 'custom_{item}' },
    ] as any),
  });
  return { nodes: [menu, ...targets], connections: [] };
}

describe('Фаза 100: hideAfterClick независимо от целевой ноды', () => {
  for (const userDatabaseEnabled of [false, true]) {
    it(`обрабатывает реальные callback через Dispatcher при БД=${userDatabaseEnabled}`, () => {
      const graph = project();
      const code = generatePythonCode(graph, { botName: 'HideAfterClick', userDatabaseEnabled });
      assert.equal(code.match(/dp.callback_query.middleware\(hide_after_click_middleware\)/g)?.length, 1);
      for (const target of graph.nodes.slice(1)) {
        assert.ok(code.includes(`async def handle_callback_${target.id}(`), target.type);
      }
      const python = existsSync('.venv/bin/python') ? '.venv/bin/python' : 'python';
      const output = execFileSync(python, [fileURLToPath(new URL('./hide-after-click-runtime.py', import.meta.url))], {
        input: code, encoding: 'utf8',
      });
      assert.ok(output.includes('OK'));
    });
  }

  it('не добавляет middleware, если флаг не включён', () => {
    const code = generatePythonCode({ nodes: [node('plain', 'message', { messageText: 'Текст' })], connections: [] }, {});
    assert.ok(!code.includes('async def hide_after_click_middleware'));
  });
});

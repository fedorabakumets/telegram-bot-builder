/** @fileoverview Проверки восстановления связей между узлами листа. */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { BotDataWithSheets, Node } from '@shared/schema';
import { extractNodesAndConnections } from './extract-nodes-and-connections';

/**
 * Создаёт минимальный узел сообщения для проверки связей.
 * @param id - Идентификатор узла.
 * @param data - Дополнительные поля узла.
 * @returns Тестовый узел сообщения.
 */
function makeMessageNode(id: string, data: Record<string, unknown> = {}): Node {
  return {
    id,
    type: 'message',
    position: { x: 0, y: 0 },
    data: {
      messageText: 'Сообщение',
      buttons: [],
      keyboardType: 'none',
      ...data,
    },
  } as unknown as Node;
}

/**
 * Создаёт условный узел с переходом.
 * @param id - Идентификатор узла.
 * @param target - Идентификатор целевого узла.
 * @returns Тестовый условный узел.
 */
function makeConditionNode(id: string, target: string): Node {
  return {
    id,
    type: 'condition',
    position: { x: 0, y: 0 },
    data: {
      variable: 'age',
      branches: [
        { id: 'branch_1', operator: 'less_than', value: '18', target },
      ],
    },
  } as Node;
}

/**
 * Создаёт узел клавиатуры с переходом.
 * @param id - Идентификатор узла.
 * @returns Тестовый узел клавиатуры.
 */
function makeKeyboardNode(id: string): Node {
  return {
    id,
    type: 'keyboard',
    position: { x: 0, y: 0 },
    data: {
      keyboardType: 'inline',
      buttons: [{ id: 'btn_1', text: 'Далее', action: 'goto', target: 'msg_2' }],
    },
  } as Node;
}

describe('extractNodesAndConnections', () => {
  it('synthesizes graph edges from node data when sheets do not store explicit connections', () => {
    const project: BotDataWithSheets = {
      sheets: [{
        id: 'sheet_1',
        name: 'Test',
        nodes: [
          makeMessageNode('msg_1', {
            enableAutoTransition: true,
            autoTransitionTo: 'cond_1',
          }),
          makeConditionNode('cond_1', 'kbd_1'),
          makeKeyboardNode('kbd_1'),
          makeMessageNode('msg_2'),
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        viewState: { zoom: 100, pan: { x: 0, y: 0 } },
      }],
      version: 2,
      activeSheetId: 'sheet_1',
    };

    const { connections } = extractNodesAndConnections(project);
    const pairs = connections.map(connection => `${connection.source}->${connection.target}`);

    assert.ok(pairs.includes('msg_1->cond_1'));
    assert.ok(pairs.includes('cond_1->kbd_1'));
    assert.ok(pairs.includes('kbd_1->msg_2'));
  });
});

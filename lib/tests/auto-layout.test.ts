/**
 * @fileoverview Юнит-тест иерархической авто-раскладки листа (createHierarchicalLayout
 * и autoLayoutSheetInProject).
 * @description Проверяет: (а) позиции нод пересчитываются; (б) состав нод и их
 * data/связи остаются нетронутыми (меняется только position); (в) изолированные
 * ноды получают валидную позицию; (г) для пустого/несуществующего листа
 * autoLayoutSheetInProject возвращает { error }.
 * @module lib/tests/auto-layout.test
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Node } from '@shared/schema';
import { createHierarchicalLayout } from '../bot-tools/hierarchical-layout.ts';
import { autoLayoutSheetInProject } from '../bot-tools/project-mutate.ts';

/**
 * Строит простой сценарий: триггер /start → message с inline-кнопкой → ответ,
 * плюс одна изолированная нода без связей.
 * @returns Массив нод листа
 */
function makeScenario(): Node[] {
  return [
    {
      id: 'trigger',
      type: 'command_trigger',
      position: { x: 0, y: 0 },
      data: { command: '/start', autoTransitionTo: 'msg', sourceNodeId: 'msg' },
    },
    {
      id: 'msg',
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        messageText: 'Выберите',
        keyboardType: 'inline',
        buttons: [{ id: 'b1', text: 'Дальше', action: 'goto', target: 'answer' }],
      },
    },
    {
      id: 'answer',
      type: 'message',
      position: { x: 0, y: 0 },
      data: { messageText: 'Готово' },
    },
    {
      id: 'isolated',
      type: 'message',
      position: { x: 0, y: 0 },
      data: { messageText: 'Никто на меня не ссылается' },
    },
  ] as unknown as Node[];
}

test('createHierarchicalLayout пересчитывает позиции и не теряет ноды/данные', () => {
  const nodes = makeScenario();
  const before = JSON.parse(JSON.stringify(nodes));
  const result = createHierarchicalLayout(nodes, [], undefined as any);

  assert.equal(result.length, nodes.length, 'количество нод не изменилось');

  // Исходный массив не мутирован
  assert.deepEqual(nodes, before, 'входные ноды не мутируются');

  // Хотя бы одна нода сместилась с (0,0)
  const moved = result.some((n) => n.position.x !== 0 || n.position.y !== 0);
  assert.ok(moved, 'позиции были пересчитаны');

  // data и type каждой ноды нетронуты
  for (const original of before) {
    const updated = result.find((n) => n.id === original.id)!;
    assert.ok(updated, `нода ${original.id} на месте`);
    assert.equal(updated.type, original.type, `type ноды ${original.id} не изменён`);
    assert.deepEqual(updated.data, original.data, `data ноды ${original.id} не изменены`);
  }
});

test('createHierarchicalLayout выдаёт позицию изолированной ноде', () => {
  const result = createHierarchicalLayout(makeScenario(), [], undefined as any);
  const isolated = result.find((n) => n.id === 'isolated')!;
  assert.ok(isolated, 'изолированная нода присутствует');
  assert.ok(Number.isFinite(isolated.position.x) && Number.isFinite(isolated.position.y), 'координаты конечны');
});

test('autoLayoutSheetInProject меняет только позиции на листе', () => {
  const sheetId = 's1';
  const project = {
    version: 2,
    activeSheetId: sheetId,
    sheets: [{ id: sheetId, name: 'Лист 1', nodes: makeScenario() }],
  };
  const res = autoLayoutSheetInProject(project, sheetId);
  assert.ok(!('error' in res), 'нет ошибки');
  if ('error' in res) return;

  const sheet = res.project.sheets![0];
  assert.equal(sheet.nodes.length, 4, 'состав нод не изменился');

  // Связи (autoTransitionTo, button target) сохранены
  const trigger = sheet.nodes.find((n) => n.id === 'trigger')!;
  assert.equal((trigger.data as any).autoTransitionTo, 'msg', 'autoTransitionTo сохранён');
  const msg = sheet.nodes.find((n) => n.id === 'msg')!;
  const buttons = (msg.data as any).buttons as any[] | undefined;
  assert.equal(buttons?.[0]?.target, 'answer', 'target кнопки сохранён');
});

test('autoLayoutSheetInProject возвращает error для пустого листа', () => {
  const project = {
    version: 2,
    activeSheetId: 's1',
    sheets: [{ id: 's1', name: 'Лист 1', nodes: [] }],
  };
  const res = autoLayoutSheetInProject(project, 's1');
  assert.ok('error' in res, 'для пустого листа возвращается error');
});

test('autoLayoutSheetInProject возвращает error для невалидного project_json', () => {
  const res = autoLayoutSheetInProject('не json', undefined);
  assert.ok('error' in res, 'для невалидного ввода возвращается error');
});

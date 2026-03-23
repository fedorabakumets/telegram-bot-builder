/**
 * @fileoverview Тесты для multi-select-transition
 * @module templates/handlers/multi-select-transition/multi-select-transition.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateMultiSelectTransition } from './multi-select-transition.renderer';
import {
  multiSelectTransitionFixture,
  commandTargetFixture,
  connectionsFixture,
  missingTargetFixture,
} from './multi-select-transition.fixture';

describe('generateMultiSelectTransition', () => {
  it('должен генерировать переход к целевому узлу через continueButtonTarget', () => {
    const result = generateMultiSelectTransition(multiSelectTransitionFixture);

    assert.ok(result.includes('if node_id == "node1":'));
    assert.ok(result.includes('Переход к узлу node2'));
    assert.ok(result.includes('🔄 Переходим к узлу node2'));
  });

  it('должен генерировать вызов команды для command узла', () => {
    const result = generateMultiSelectTransition(commandTargetFixture);

    assert.ok(result.includes('await handle_command_menu'));
  });

  it('должен генерировать переход по соединению если нет continueButtonTarget', () => {
    const result = generateMultiSelectTransition(connectionsFixture);

    assert.ok(result.includes('Переход к узлу node2 через соединение'));
  });

  it('должен обрабатывать случай несуществующего целевого узла', () => {
    const result = generateMultiSelectTransition(missingTargetFixture);

    assert.ok(result.includes('Целевой узел не найден'));
    assert.ok(result.includes('✅ Выбор завершен!'));
  });

  it('должен содержать предупреждение для неизвестного типа узла', () => {
    const result = generateMultiSelectTransition({
      multiSelectNodes: [
        {
          id: 'node1',
          data: {
            continueButtonTarget: 'node2',
          },
        },
      ],
      nodes: [
        {
          id: 'node1',
          type: 'message',
          data: {
            allowMultipleSelection: true,
          },
        },
        {
          id: 'node2',
          type: 'unknown_type',
          data: {},
        },
      ] as any[],
      connections: [],
      indentLevel: '        ',
    });

    assert.ok(result.includes('⚠️ Неизвестный тип узла'));
  });
});

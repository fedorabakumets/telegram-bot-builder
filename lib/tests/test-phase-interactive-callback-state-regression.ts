/**
 * @fileoverview Регресс-тест для generic interactive callback-обработчиков с state
 * @module tests/test-phase-interactive-callback-state-regression
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { generateCallbackHandlerInit } from '../templates/callback-handler-init/callback-handler-init.renderer';
import { generateInteractiveCallbackHandlers } from '../templates/keyboard-handlers/interactive-callback-handlers/interactive-callback-handlers.renderer';

/**
 * Создаёт минимальный generic callback-обработчик для проверки наличия state.
 * @returns Сгенерированный Python-код interactive callback-обработчика
 */
function createGenericInteractiveHandlerCode(): string {
  const targetNode = {
    id: 'generic-target',
    type: 'custom_action',
    data: { buttons: [] },
  };
  const sourceNode = {
    id: 'source-keyboard',
    type: 'keyboard',
    data: {
      buttons: [{ text: 'Открыть', action: 'goto', target: 'generic-target' }],
    },
  };

  return generateInteractiveCallbackHandlers({
    inlineNodes: [],
    allReferencedNodeIds: new Set(['generic-target']),
    allConditionalButtons: new Set<string>(),
    nodes: [sourceNode as any, targetNode as any],
    allNodeIds: ['source-keyboard', 'generic-target'],
    connections: [],
    userDatabaseEnabled: false,
    mediaVariablesMap: new Map(),
    processNodeButtonsAndGenerateHandlers: () => {},
  });
}

describe('Фаза: interactive callback state regression', () => {
  it('callback-handler-init не генерирует обращения к state при includeStateSync=false', () => {
    const code = generateCallbackHandlerInit({
      nodeId: 'node-without-state',
      hasHideAfterClick: false,
      includeStateSync: false,
      variableFilters: null,
    });

    assert.ok(!code.includes('if state is not None:'));
    assert.ok(!code.includes('await state.get_data()'));
  });

  it('generic interactive callback-обработчик принимает state: FSMContext = None для совместимости с автопереходами', () => {
    const code = createGenericInteractiveHandlerCode();

    // Обработчик должен принимать state для корректной работы автопереходов
    assert.match(
      code,
      /async def handle_callback_generic_target\(callback_query: types\.CallbackQuery, state: FSMContext = None\):/,
    );
    assert.ok(!code.includes('if state is not None:'));
    assert.ok(!code.includes('await state.get_data()'));
  });
});

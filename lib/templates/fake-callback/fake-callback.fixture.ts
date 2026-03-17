/**
 * @fileoverview Тестовые данные для шаблона fake-callback
 * @module templates/fake-callback/fake-callback.fixture
 */

import type { FakeCallbackTemplateParams } from './fake-callback.params';

/** Валидные параметры: базовый fake callback */
export const validParamsBasic: FakeCallbackTemplateParams = {
  targetNodeId: 'node_target',
  sourceNodeId: 'node_source',
  safeFunctionName: 'node_target',
};

/** Валидные параметры: с дефисами в ID */
export const validParamsWithDashes: FakeCallbackTemplateParams = {
  targetNodeId: 'node-target-1',
  sourceNodeId: 'node-source-1',
  safeFunctionName: 'node_target_1',
};

/** Валидные параметры: с кастомным отступом */
export const validParamsWithIndent: FakeCallbackTemplateParams = {
  targetNodeId: 'node_b',
  sourceNodeId: 'node_a',
  safeFunctionName: 'node_b',
  indentLevel: '        ',
};

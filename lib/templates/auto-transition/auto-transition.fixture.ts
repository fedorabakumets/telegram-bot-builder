/**
 * @fileoverview Тестовые данные для шаблона auto-transition
 * @module templates/auto-transition/auto-transition.fixture
 */

import type { AutoTransitionTemplateParams } from './auto-transition.params';

/** Валидные параметры: переход к существующему узлу */
export const validParamsTargetExists: AutoTransitionTemplateParams = {
  nodeId: 'node_source',
  autoTransitionTarget: 'node_target',
  targetExists: true,
};

/** Валидные параметры: переход к несуществующему узлу */
export const validParamsTargetMissing: AutoTransitionTemplateParams = {
  nodeId: 'node_source',
  autoTransitionTarget: 'node_missing',
  targetExists: false,
};

/** Валидные параметры: с кастомным отступом */
export const validParamsWithIndent: AutoTransitionTemplateParams = {
  nodeId: 'node_a',
  autoTransitionTarget: 'node_b',
  targetExists: true,
  indentLevel: '        ',
};

/** Ожидаемый вывод: переход к существующему узлу */
export const expectedOutputTargetExists = 'handle_callback_node_target';

/** Ожидаемый вывод: переход к несуществующему узлу */
export const expectedOutputTargetMissing = 'Узел автоперехода не найден';

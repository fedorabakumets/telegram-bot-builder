/**
 * @fileoverview Тестовые данные для шаблона handle_node_* функций
 * @module templates/handle-node-function/handle-node-function.fixture
 */

import type { HandleNodeFunctionParams, HandleNodeFunctionsParams } from './handle-node-function.params';

/** Базовый узел без условий */
export const validParamsBasic: HandleNodeFunctionParams = {
  nodeId: 'node_abc123',
  safeName: 'node_abc123',
  messageText: 'Привет! Введите ваше имя:',
  formatMode: 'none',
  imageUrl: '',
  attachedMedia: [],
  enableConditionalMessages: false,
  conditionalMessages: [],
  variableFiltersJson: '{}',
  enableAutoTransition: false,
  autoTransitionTo: '',
  collectUserInput: true,
  inputType: 'text',
  inputTargetNodeId: 'node_next',
  usedVariables: [],
};

/** Узел с условными сообщениями */
export const validParamsWithConditional: HandleNodeFunctionParams = {
  nodeId: 'node_cond1',
  safeName: 'node_cond1',
  messageText: 'Добро пожаловать!',
  formatMode: 'html',
  imageUrl: '',
  attachedMedia: [],
  enableConditionalMessages: true,
  conditionalMessages: [
    {
      variableName: 'is_premium',
      logicOperator: 'AND',
      condition: 'is_premium',
      messageText: '⭐ Привет, премиум пользователь!',
      priority: 1,
    },
    {
      variableNames: ['is_admin', 'is_moderator'],
      logicOperator: 'OR',
      condition: 'is_admin OR is_moderator',
      messageText: '🔑 Привет, администратор!',
      priority: 2,
    },
  ],
  variableFiltersJson: '{}',
  enableAutoTransition: false,
  autoTransitionTo: '',
  collectUserInput: true,
  inputType: 'text',
  inputTargetNodeId: 'node_after_cond',
  usedVariables: [],
};

/** Узел с автопереходом */
export const validParamsWithAutoTransition: HandleNodeFunctionParams = {
  nodeId: 'node_auto1',
  safeName: 'node_auto1',
  messageText: 'Обрабатываю...',
  formatMode: 'none',
  imageUrl: '',
  attachedMedia: [],
  enableConditionalMessages: true,
  conditionalMessages: [
    {
      variableName: 'step_done',
      logicOperator: 'AND',
      messageText: '✅ Шаг выполнен!',
      priority: 1,
    },
  ],
  variableFiltersJson: '{}',
  enableAutoTransition: true,
  autoTransitionTo: 'node_result',
  collectUserInput: false,
  inputType: 'text',
  inputTargetNodeId: '',
  usedVariables: [],
};

/** Узел с изображением */
export const validParamsWithImage: HandleNodeFunctionParams = {
  nodeId: 'node_img1',
  safeName: 'node_img1',
  messageText: 'Посмотрите на это изображение:',
  formatMode: 'none',
  imageUrl: 'https://example.com/image.jpg',
  attachedMedia: [],
  enableConditionalMessages: true,
  conditionalMessages: [
    {
      variableName: 'show_image',
      logicOperator: 'AND',
      messageText: '🖼️ Вот ваше изображение!',
      priority: 1,
    },
  ],
  variableFiltersJson: '{}',
  enableAutoTransition: false,
  autoTransitionTo: '',
  collectUserInput: true,
  inputType: 'text',
  inputTargetNodeId: 'node_after_img',
  usedVariables: [],
};

/** Параметры для нескольких узлов */
export const validParamsMultiple: HandleNodeFunctionsParams = {
  nodes: [validParamsBasic, validParamsWithConditional],
};

/** Невалидные параметры: отсутствует nodeId */
export const invalidParamsMissingNodeId = {
  safeName: 'node_test',
  messageText: 'Привет!',
};

/** Невалидные параметры: неправильный тип */
export const invalidParamsWrongType = {
  nodeId: 123,
  safeName: 'node_test',
};

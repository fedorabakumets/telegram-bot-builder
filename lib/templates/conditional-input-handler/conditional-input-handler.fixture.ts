/**
 * @fileoverview Тестовые данные для шаблона conditional-input-handler
 * @module templates/conditional-input-handler/conditional-input-handler.fixture
 */

import type { ConditionalInputHandlerTemplateParams } from './conditional-input-handler.params';

export const nodesSimple = [
  { id: 'node_abc', safeName: 'node_abc', type: 'message', data: { messageText: 'Привет' } },
  { id: 'node_xyz', safeName: 'node_xyz', type: 'message', data: { messageText: 'Продолжение' } },
];

export const nodesWithInput = [
  {
    id: 'node_input_1',
    safeName: 'node_input_1',
    type: 'message',
    data: {
      messageText: 'Введите данные',
      collectUserInput: true,
      inputVariable: 'user_answer',
      inputTargetNodeId: 'node_abc',
    },
  },
];

export const nodesWithSkipButtons = [
  {
    id: 'node_skip_1',
    safeName: 'node_skip_1',
    type: 'message',
    data: {
      messageText: 'Выберите действие',
      buttons: [
        { id: 'btn_skip', text: 'Пропустить', action: 'goto', target: 'node_abc', skipDataCollection: true },
      ],
    },
  },
];

export const validParamsMinimal: ConditionalInputHandlerTemplateParams = {
  nodes: [],
  allNodeIds: [],
};

export const validParamsWithNodes: ConditionalInputHandlerTemplateParams = {
  nodes: nodesSimple,
  allNodeIds: ['node_abc', 'node_xyz'],
};

export const validParamsWithInput: ConditionalInputHandlerTemplateParams = {
  nodes: nodesWithInput,
  allNodeIds: ['node_input_1', 'node_abc'],
};

export const validParamsWithSkipButtons: ConditionalInputHandlerTemplateParams = {
  nodes: [...nodesWithSkipButtons, ...nodesSimple],
  allNodeIds: ['node_skip_1', 'node_abc'],
};

export const validParamsCustomIndent: ConditionalInputHandlerTemplateParams = {
  nodes: nodesSimple,
  allNodeIds: ['node_abc', 'node_xyz'],
  indentLevel: '        ',
};

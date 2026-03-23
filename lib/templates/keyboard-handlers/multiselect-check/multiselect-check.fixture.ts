/**
 * @fileoverview Тестовые данные для шаблона multiselect-check
 * @module templates/multiselect-check/multiselect-check.fixture
 */

import type { MultiSelectCheckTemplateParams } from '../../multiselect-check/multiselect-check.params';

export const nodesWithMultiSelect = [
  {
    id: 'node_multi_1',
    safeName: 'node_multi_1',
    type: 'message',
    data: {
      messageText: 'Выберите опции:',
      keyboardType: 'reply',
      allowMultipleSelection: true,
      multiSelectVariable: 'selected_items',
      continueButtonText: 'Готово',
      continueButtonTarget: 'node_next',
      buttons: [
        { id: 'btn_sel_1', text: 'Опция 1', action: 'selection' },
        { id: 'btn_sel_2', text: 'Опция 2', action: 'selection' },
        { id: 'btn_done', text: 'Готово', action: 'complete' },
      ],
    },
  },
  {
    id: 'node_next',
    safeName: 'node_next',
    type: 'message',
    data: {
      messageText: 'Спасибо за выбор!',
    },
  },
];

export const nodesWithGoto = [
  {
    id: 'node_multi_2',
    safeName: 'node_multi_2',
    type: 'message',
    data: {
      messageText: 'Выберите:',
      allowMultipleSelection: true,
      multiSelectVariable: 'choices',
      buttons: [
        { id: 'btn_sel', text: 'Выбор', action: 'selection' },
        { id: 'btn_goto', text: 'Перейти', action: 'goto', target: 'node_target' },
        { id: 'btn_done', text: 'Готово', action: 'complete' },
      ],
    },
  },
  {
    id: 'node_target',
    safeName: 'node_target',
    type: 'message',
    data: { messageText: 'Целевой узел' },
  },
];

export const validParamsMinimal: MultiSelectCheckTemplateParams = {
  nodes: [],
  allNodeIds: [],
};

export const validParamsWithMultiSelect: MultiSelectCheckTemplateParams = {
  nodes: nodesWithMultiSelect,
  allNodeIds: ['node_multi_1', 'node_next'],
};

export const validParamsWithGoto: MultiSelectCheckTemplateParams = {
  nodes: nodesWithGoto,
  allNodeIds: ['node_multi_2', 'node_target'],
};

export const validParamsCustomIndent: MultiSelectCheckTemplateParams = {
  nodes: nodesWithMultiSelect,
  allNodeIds: ['node_multi_1', 'node_next'],
  indentLevel: '        ',
};

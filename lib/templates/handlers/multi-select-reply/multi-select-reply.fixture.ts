/**
 * @fileoverview Тестовые данные для шаблона multi-select reply обработчика
 * @module templates/handlers/multi-select-reply/multi-select-reply.fixture
 */

import type { MultiSelectReplyTemplateParams } from './multi-select-reply.params';

/** Валидные параметры: базовый multi-select reply */
export const validParamsBasic: MultiSelectReplyTemplateParams = {
  multiSelectNodes: [
    {
      id: 'node_123',
      variableName: 'user_interests',
      selectionButtons: [
        {
          id: 'btn_1',
          text: 'Опция 1',
          action: 'selection',
          target: 'opt1',
        },
        {
          id: 'btn_2',
          text: 'Опция 2',
          action: 'selection',
          target: 'opt2',
        },
      ],
      regularButtons: [],
      gotoButtons: [],
      completeButton: {
        text: 'Готово',
      },
      continueButtonText: 'Готово',
      messageText: 'Выберите опции:',
      resizeKeyboard: true,
      oneTimeKeyboard: false,
      adjustCode: 'builder.adjust(2)',
    },
  ],
  allNodes: [
    {
      id: 'node_123',
      type: 'message',
      data: {
        keyboardType: 'reply',
        allowMultipleSelection: true,
      },
    },
  ],
  allNodeIds: ['node_123'],
  indentLevel: '',
};

/** Валидные параметры: с goto кнопками */
export const validParamsWithGotoButtons: MultiSelectReplyTemplateParams = {
  multiSelectNodes: [
    {
      id: 'node_456',
      variableName: 'user_topics',
      selectionButtons: [
        {
          id: 'btn_1',
          text: 'Тема 1',
          action: 'selection',
        },
      ],
      regularButtons: [
        {
          id: 'btn_skip',
          text: 'Пропустить',
          action: 'goto',
          target: 'skip_node',
        },
      ],
      gotoButtons: [
        {
          id: 'btn_goto',
          text: 'Перейти',
          action: 'goto',
          target: 'target_node',
          targetNode: {
            id: 'target_node',
            type: 'message',
            data: {},
          },
        },
      ],
      completeButton: {
        text: 'Завершить',
        target: 'next_node',
      },
      continueButtonTarget: 'next_node',
      targetNode: {
        id: 'next_node',
        type: 'message',
        data: {
          messageText: 'Следующее сообщение',
        },
      },
      messageText: 'Выберите темы:',
    },
  ],
  allNodes: [
    { id: 'node_456', type: 'message' },
    { id: 'target_node', type: 'message' },
    { id: 'next_node', type: 'message' },
  ],
  allNodeIds: ['node_456', 'target_node', 'next_node'],
};

/** Валидные параметры: с command целевым узлом */
export const validParamsWithCommandTarget: MultiSelectReplyTemplateParams = {
  multiSelectNodes: [
    {
      id: 'node_cmd',
      variableName: 'user_data_var',
      selectionButtons: [
        {
          id: 'btn_1',
          text: 'Выбор 1',
          action: 'selection',
        },
      ],
      regularButtons: [],
      gotoButtons: [],
      completeButton: {
        text: 'Готово',
        target: 'command_node',
      },
      continueButtonTarget: 'command_node',
      targetNode: {
        id: 'command_node',
        type: 'command',
        data: {
          command: '/mycommand',
        },
      },
      messageText: 'Выберите:',
    },
  ],
  allNodes: [
    { id: 'node_cmd', type: 'message' },
    { id: 'command_node', type: 'command', data: { command: '/mycommand' } },
  ],
  allNodeIds: ['node_cmd', 'command_node'],
};

/** Валидные параметры: несколько узлов */
export const validParamsMultipleNodes: MultiSelectReplyTemplateParams = {
  multiSelectNodes: [
    {
      id: 'node_1',
      variableName: 'var_1',
      selectionButtons: [
        { id: 'btn_1', text: 'Выбор 1', action: 'selection' },
      ],
      regularButtons: [],
      gotoButtons: [],
      completeButton: { text: 'Готово' },
      messageText: 'Узел 1',
    },
    {
      id: 'node_2',
      variableName: 'var_2',
      selectionButtons: [
        { id: 'btn_2', text: 'Выбор 2', action: 'selection' },
      ],
      regularButtons: [],
      gotoButtons: [],
      completeButton: { text: 'Готово' },
      messageText: 'Узел 2',
    },
  ],
  allNodes: [
    { id: 'node_1', type: 'message' },
    { id: 'node_2', type: 'message' },
  ],
  allNodeIds: ['node_1', 'node_2'],
};

/** Валидные параметры: пустой массив узлов */
export const validParamsEmpty: MultiSelectReplyTemplateParams = {
  multiSelectNodes: [],
  allNodes: [],
  allNodeIds: [],
  indentLevel: '',
};

/** Валидные параметры: с custom indent */
export const validParamsCustomIndent: MultiSelectReplyTemplateParams = {
  multiSelectNodes: [
    {
      id: 'node_indent',
      variableName: 'var_indent',
      selectionButtons: [
        { id: 'btn_1', text: 'Тест', action: 'selection' },
      ],
      regularButtons: [],
      gotoButtons: [],
      completeButton: { text: 'Готово' },
      messageText: 'Тест',
    },
  ],
  allNodes: [{ id: 'node_indent', type: 'message' }],
  allNodeIds: ['node_indent'],
  indentLevel: '        ',
};

/** Невалидные параметры: отсутствует multiSelectNodes */
export const invalidParamsMissingNodes = {
  allNodes: [],
  allNodeIds: [],
};

/** Невалидные параметры: неправильный тип */
export const invalidParamsWrongType = {
  multiSelectNodes: 'not_an_array',
  allNodes: [],
  allNodeIds: [],
};

/** Ожидаемый вывод: базовый */
export const expectedOutputBasic = `
# Обработчик для reply кнопок множественного выбора
@dp.message()
async def handle_multi_select_reply(message: types.Message):
    user_id = message.from_user.id
    user_input = message.text
`.trim();

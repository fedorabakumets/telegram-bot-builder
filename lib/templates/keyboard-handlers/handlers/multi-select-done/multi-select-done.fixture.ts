/**
 * @fileoverview Тестовые данные для шаблона multi-select done обработчика
 * @module templates/handlers/multi-select-done/multi-select-done.fixture
 */

import type { MultiSelectDoneTemplateParams } from './multi-select-done.params';

/** Валидные параметры: базовый multi-select done */
export const validParamsBasic: MultiSelectDoneTemplateParams = {
  multiSelectNodes: [
    {
      id: 'node_123',
      variableName: 'user_interests',
      continueButtonTarget: 'next_node',
      targetNode: {
        id: 'next_node',
        type: 'message',
        data: {
          keyboardType: 'inline',
          allowMultipleSelection: false,
          messageText: 'Следующее сообщение',
          buttons: [],
        },
      },
    },
  ],
  allNodes: [
    {
      id: 'node_123',
      type: 'message',
      data: {
        allowMultipleSelection: true,
        keyboardType: 'inline',
      },
    },
    {
      id: 'next_node',
      type: 'message',
      data: {
        messageText: 'Следующее сообщение',
      },
    },
  ],
  allNodeIds: ['node_123', 'next_node'],
  indentLevel: '',
};

/** Валидные параметры: с множественным выбором в целевом узле */
export const validParamsWithMultiSelectTarget: MultiSelectDoneTemplateParams = {
  multiSelectNodes: [
    {
      id: 'node_456',
      variableName: 'user_preferences',
      continueButtonTarget: 'multi_select_node',
      targetNode: {
        id: 'multi_select_node',
        type: 'message',
        data: {
          keyboardType: 'inline',
          allowMultipleSelection: true,
          messageText: 'Выберите опции',
          multiSelectVariable: 'user_choices',
          buttons: [
            {
              id: 'btn_1',
              text: 'Опция 1',
              action: 'selection',
              callbackData: 'ms_msn_opt1',
            },
            {
              id: 'btn_2',
              text: 'Опция 2',
              action: 'selection',
              callbackData: 'ms_msn_opt2',
            },
            {
              id: 'btn_done',
              text: 'Готово',
              action: 'complete',
            },
          ],
        },
        shortId: 'msn',
        adjustCode: 'builder.adjust(2)',
      },
    },
  ],
  allNodes: [
    {
      id: 'node_456',
      type: 'message',
    },
    {
      id: 'multi_select_node',
      type: 'message',
      data: {
        allowMultipleSelection: true,
        keyboardType: 'inline',
      },
    },
  ],
  allNodeIds: ['node_456', 'multi_select_node'],
};

/** Валидные параметры: reply клавиатура */
export const validParamsReplyKeyboard: MultiSelectDoneTemplateParams = {
  multiSelectNodes: [
    {
      id: 'node_reply',
      variableName: 'user_topics',
      continueButtonTarget: 'reply_node',
      targetNode: {
        id: 'reply_node',
        type: 'message',
        data: {
          keyboardType: 'reply',
          allowMultipleSelection: true,
          messageText: 'Выберите темы',
          multiSelectVariable: 'topics',
          resizeKeyboard: true,
          oneTimeKeyboard: false,
          buttons: [
            {
              id: 'btn_1',
              text: 'Тема 1',
              action: 'selection',
            },
            {
              id: 'btn_done',
              text: 'Готово',
              action: 'complete',
            },
          ],
        },
      },
    },
  ],
  allNodes: [
    {
      id: 'node_reply',
      type: 'message',
    },
    {
      id: 'reply_node',
      type: 'message',
    },
  ],
  allNodeIds: ['node_reply', 'reply_node'],
};

/** Валидные параметры: без целевого узла */
export const validParamsNoTarget: MultiSelectDoneTemplateParams = {
  multiSelectNodes: [
    {
      id: 'node_no_target',
      variableName: 'user_data_var',
      continueButtonTarget: undefined,
    },
  ],
  allNodes: [],
  allNodeIds: ['node_no_target'],
};

/** Валидные параметры: несколько узлов */
export const validParamsMultipleNodes: MultiSelectDoneTemplateParams = {
  multiSelectNodes: [
    {
      id: 'node_1',
      variableName: 'var_1',
      continueButtonTarget: 'next_1',
    },
    {
      id: 'node_2',
      variableName: 'var_2',
      continueButtonTarget: 'next_2',
    },
  ],
  allNodes: [
    { id: 'node_1', type: 'message' },
    { id: 'node_2', type: 'message' },
    { id: 'next_1', type: 'message' },
    { id: 'next_2', type: 'message' },
  ],
  allNodeIds: ['node_1', 'node_2', 'next_1', 'next_2'],
};

/** Валидные параметры: пустой массив узлов */
export const validParamsEmpty: MultiSelectDoneTemplateParams = {
  multiSelectNodes: [],
  allNodes: [],
  allNodeIds: [],
  indentLevel: '',
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
# Обработчик для кнопок завершения множественного выбора
@dp.callback_query(lambda callback_query: callback_query.data and callback_query.data.startswith("multi_select_done_"))
async def handle_multi_select_done(callback_query: types.CallbackQuery):
    logging.info(f"🏁 ОБРАБОТЧИК ГОТОВО АКТИВИРОВАН! callback_data: {callback_query.data}")
`.trim();

/**
 * @fileoverview Тестовые данные для шаблона multi-select button обработчика
 * @module templates/handlers/multi-select-button-handler/multi-select-button-handler.fixture
 */

import type { MultiSelectButtonHandlerTemplateParams } from './multi-select-button-handler.params';

/** Валидные параметры: базовый multi-select с done кнопкой */
export const validParamsBasic: MultiSelectButtonHandlerTemplateParams = {
  targetNode: {
    id: 'node_123',
    type: 'message',
    allowMultipleSelection: true,
    continueButtonTarget: 'next_node',
    multiSelectVariable: 'user_interests',
    data: {
      allowMultipleSelection: true,
      continueButtonTarget: 'next_node',
      multiSelectVariable: 'user_interests',
      keyboardType: 'inline',
      messageText: 'Выберите опции',
    },
  },
  callbackData: 'ms_abc123_btn456',
  shortNodeIdForDone: 'abc123',
  button: {
    id: 'btn_1',
    text: 'Опция 1',
    action: 'goto',
    target: 'next',
    skipDataCollection: false,
  },
  node: {
    id: 'node_123',
    inputVariable: 'user_choice',
  },
  nodes: [
    { id: 'node_123', type: 'message', data: {} },
    { id: 'next_node', type: 'message', data: {} },
  ],
  indentLevel: '    ',
};

/** Валидные параметры: без done кнопки */
export const validParamsWithoutDone: MultiSelectButtonHandlerTemplateParams = {
  targetNode: {
    id: 'node_456',
    type: 'message',
    allowMultipleSelection: false,
    data: {
      allowMultipleSelection: false,
      keyboardType: 'inline',
    },
  },
  callbackData: 'ms_def456_btn789',
  button: {
    id: 'btn_2',
    text: 'Кнопка 2',
    action: 'goto',
    target: 'target',
    skipDataCollection: false,
  },
  node: {
    id: 'node_456',
    inputVariable: 'selection',
  },
  nodes: [
    { id: 'node_456', type: 'message', data: {} },
  ],
};

/** Валидные параметры: с skipDataCollection */
export const validParamsSkipData: MultiSelectButtonHandlerTemplateParams = {
  targetNode: {
    id: 'node_789',
    type: 'message',
    data: {
      keyboardType: 'inline',
    },
  },
  callbackData: 'ms_ghi789_btn012',
  button: {
    id: 'btn_3',
    text: 'Пропустить',
    action: 'goto',
    target: 'skip_target',
    skipDataCollection: true,
  },
  node: {
    id: 'node_789',
    inputVariable: 'skip_var',
  },
  nodes: [
    { id: 'node_789', type: 'message', data: {} },
  ],
};

/** Валидные параметры: metro_selection special case */
export const validParamsMetroSelection: MultiSelectButtonHandlerTemplateParams = {
  targetNode: {
    id: 'metro_selection_node',
    type: 'message',
    allowMultipleSelection: true,
    continueButtonTarget: 'interests_result',
    multiSelectVariable: 'metro_stations',
    data: {
      allowMultipleSelection: true,
      continueButtonTarget: 'interests_result',
      multiSelectVariable: 'metro_stations',
    },
  },
  callbackData: 'ms_metro_btn',
  shortNodeIdForDone: 'metro',
  button: {
    id: 'btn_metro',
    text: 'Пушкинская',
    action: 'goto',
    target: 'metro',
    skipDataCollection: false,
  },
  node: {
    id: 'metro_selection_node',
    inputVariable: 'metro_choice',
  },
  nodes: [
    { id: 'metro_selection_node', type: 'message', data: {} },
    { id: 'interests_result', type: 'message', data: {} },
  ],
};

/** Валидные параметры: без inputVariable в узле */
export const validParamsNoInputVariable: MultiSelectButtonHandlerTemplateParams = {
  targetNode: {
    id: 'node_no_var',
    type: 'message',
    data: {},
  },
  callbackData: 'ms_novar_btn',
  button: {
    id: 'btn_novar',
    text: 'Кнопка без переменной',
    action: 'goto',
    skipDataCollection: false,
  },
  node: {
    id: 'node_no_var',
  },
  nodes: [
    { id: 'node_no_var', type: 'message', data: {} },
  ],
};

/** Невалидные параметры: отсутствует callbackData */
export const invalidParamsMissingCallbackData = {
  targetNode: { id: 'node_1', type: 'message', data: {} },
  button: { id: 'btn_1', text: 'Test', action: 'goto' },
  node: { id: 'node_1' },
  nodes: [],
};

/** Невалидные параметры: неправильный тип button */
export const invalidParamsWrongButtonType = {
  callbackData: 'ms_test_btn',
  button: 'not_an_object',
  node: { id: 'node_1' },
  nodes: [],
};

/** Ожидаемый вывод: базовый с done кнопкой */
export const expectedOutputBasic = `
    @dp.callback_query(lambda c: c.data == "ms_abc123_btn456" or c.data.startswith("ms_abc123_btn456_btn_") or c.data == "done_abc123")
    async def handle_callback_ms_abc123_btn456(callback_query: types.CallbackQuery):
        await callback_query.answer()
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"📱 Обработка callback: {callback_data}")

        # Проверяем, является ли это кнопкой "Готово" для множественного выбора
        if callback_data == "done_abc123":
`.trim();

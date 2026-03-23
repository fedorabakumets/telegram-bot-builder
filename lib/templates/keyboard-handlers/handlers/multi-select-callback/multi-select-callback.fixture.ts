/**
 * @fileoverview Тестовые данные для шаблона multi-select callback обработчика
 * @module templates/handlers/multi-select-callback/multi-select-callback.fixture
 */

import type { MultiSelectCallbackTemplateParams } from './multi-select-callback.params';

/** Валидные параметры: базовый multi-select узел */
export const validParamsBasic: MultiSelectCallbackTemplateParams = {
  multiSelectNodes: [
    {
      id: 'node_123',
      shortNodeId: 'abc123',
      selectionButtons: [
        {
          id: 'btn_1',
          text: 'Опция 1',
          action: 'selection',
          target: 'opt1',
          value: 'opt1',
          valueTruncated: 'opt1',
          escapedText: 'Опция 1',
          callbackData: 'ms_abc123_opt1',
        },
        {
          id: 'btn_2',
          text: 'Опция 2',
          action: 'selection',
          target: 'opt2',
          value: 'opt2',
          valueTruncated: 'opt2',
          escapedText: 'Опция 2',
          callbackData: 'ms_abc123_opt2',
        },
      ],
      regularButtons: [],
      completeButton: {
        text: 'Готово',
        target: 'next_node',
      },
      doneCallbackData: 'done_abc123',
      totalButtonsCount: 3,
    },
  ],
  allNodeIds: ['node_123', 'next_node'],
  indentLevel: '    ',
};

/** Валидные параметры: с обычными кнопками */
export const validParamsWithRegularButtons: MultiSelectCallbackTemplateParams = {
  multiSelectNodes: [
    {
      id: 'node_456',
      shortNodeId: 'def456',
      selectionButtons: [
        {
          id: 'btn_1',
          text: 'Интерес 1',
          action: 'selection',
          target: 'int1',
          value: 'int1',
          valueTruncated: 'int1',
          escapedText: 'Интерес 1',
          callbackData: 'ms_def456_int1',
        },
      ],
      regularButtons: [
        {
          id: 'btn_goto',
          text: 'Перейти',
          action: 'goto',
          target: 'target_node',
        },
        {
          id: 'btn_url',
          text: 'Сайт',
          action: 'url',
          url: 'https://example.com',
        },
      ],
      completeButton: {
        text: 'Завершить',
        target: 'final_node',
      },
      doneCallbackData: 'done_def456',
      totalButtonsCount: 4,
    },
  ],
  allNodeIds: ['node_456', 'target_node', 'final_node'],
};

/** Валидные параметры: несколько узлов */
export const validParamsMultipleNodes: MultiSelectCallbackTemplateParams = {
  multiSelectNodes: [
    {
      id: 'node_1',
      shortNodeId: 'n1',
      selectionButtons: [
        {
          id: 'btn_1',
          text: 'Выбор 1',
          action: 'selection',
          target: 'sel1',
          value: 'sel1',
          valueTruncated: 'sel1',
          escapedText: 'Выбор 1',
          callbackData: 'ms_n1_sel1',
        },
      ],
      regularButtons: [],
      totalButtonsCount: 1,
    },
    {
      id: 'node_2',
      shortNodeId: 'n2',
      selectionButtons: [
        {
          id: 'btn_2',
          text: 'Выбор 2',
          action: 'selection',
          target: 'sel2',
          value: 'sel2',
          valueTruncated: 'sel2',
          escapedText: 'Выбор 2',
          callbackData: 'ms_n2_sel2',
        },
      ],
      regularButtons: [],
      totalButtonsCount: 1,
    },
  ],
  allNodeIds: ['node_1', 'node_2'],
};

/** Валидные параметры: с раскладкой */
export const validParamsWithLayout: MultiSelectCallbackTemplateParams = {
  multiSelectNodes: [
    {
      id: 'node_layout',
      shortNodeId: 'lay123',
      selectionButtons: [
        {
          id: 'btn_1',
          text: 'Опция 1',
          action: 'selection',
          target: 'opt1',
          value: 'opt1',
          valueTruncated: 'opt1',
          escapedText: 'Опция 1',
          callbackData: 'ms_lay123_opt1',
        },
        {
          id: 'btn_2',
          text: 'Опция 2',
          action: 'selection',
          target: 'opt2',
          value: 'opt2',
          valueTruncated: 'opt2',
          escapedText: 'Опция 2',
          callbackData: 'ms_lay123_opt2',
        },
      ],
      regularButtons: [],
      completeButton: {
        text: 'Готово',
        target: 'next',
      },
      doneCallbackData: 'done_lay123',
      hasKeyboardLayout: true,
      keyboardLayoutAuto: false,
      adjustCode: '2, 1',
      totalButtonsCount: 3,
    },
  ],
  allNodeIds: ['node_layout', 'next'],
};

/** Валидные параметры: пустой массив узлов */
export const validParamsEmpty: MultiSelectCallbackTemplateParams = {
  multiSelectNodes: [],
  allNodeIds: [],
  indentLevel: '    ',
};

/** Валидные параметры: с custom indent */
export const validParamsCustomIndent: MultiSelectCallbackTemplateParams = {
  multiSelectNodes: [
    {
      id: 'node_indent',
      shortNodeId: 'ind123',
      selectionButtons: [
        {
          id: 'btn_1',
          text: 'Тест',
          action: 'selection',
          target: 'test',
          value: 'test',
          valueTruncated: 'test',
          escapedText: 'Тест',
          callbackData: 'ms_ind123_test',
        },
      ],
      regularButtons: [],
      totalButtonsCount: 1,
    },
  ],
  allNodeIds: ['node_indent'],
  indentLevel: '        ',
};

/** Невалидные параметры: отсутствует multiSelectNodes */
export const invalidParamsMissingNodes = {
  allNodeIds: ['node_1'],
};

/** Невалидные параметры: неправильный тип */
export const invalidParamsWrongType = {
  multiSelectNodes: 'not_an_array',
  allNodeIds: [],
};

/** Ожидаемый вывод: базовый */
export const expectedOutputBasic = `
    # Обработка выбора опции
    logging.info(f"📱 Обрабатываем callback_data: {callback_data}")

    # Поддерживаем и новый формат ms_ и старый multi_select_
    if callback_data.startswith("ms_"):
`.trim();

/**
 * @fileoverview Тестовые данные для шаблона button-response обработчика
 * @module templates/handlers/button-response/button-response.fixture
 */

import type { ButtonResponseTemplateParams } from './button-response.params';

/** Валидные параметры: базовый button-response */
export const validParamsBasic: ButtonResponseTemplateParams = {
  userInputNodes: [
    {
      id: 'node_123',
      responseOptions: [
        { text: 'Опция 1', value: 'opt1' },
        { text: 'Опция 2', value: 'opt2' },
        { text: 'Опция 3', value: 'opt3' },
      ],
      allowSkip: false,
    },
  ],
  allNodes: [
    { id: 'node_123', type: 'message' },
    { id: 'next_node', type: 'message' },
  ],
  hasUrlButtonsInProject: false,
  indentLevel: '',
};

/** Валидные параметры: с allowSkip */
export const validParamsWithSkip: ButtonResponseTemplateParams = {
  userInputNodes: [
    {
      id: 'node_skip',
      responseOptions: [
        { text: 'Да', value: 'yes' },
        { text: 'Нет', value: 'no' },
      ],
      allowSkip: true,
    },
  ],
  allNodes: [
    { id: 'node_skip', type: 'message' },
  ],
  hasUrlButtonsInProject: false,
};

/** Валидные параметры: с URL кнопками */
export const validParamsWithUrl: ButtonResponseTemplateParams = {
  userInputNodes: [
    {
      id: 'node_url',
      responseOptions: [
        { text: 'Открыть сайт', value: 'site', action: 'url', url: 'https://example.com' },
        { text: 'Пропустить', value: 'skip', action: 'goto', target: 'next' },
      ],
      allowSkip: false,
    },
  ],
  allNodes: [
    { id: 'node_url', type: 'message' },
    { id: 'next', type: 'message' },
  ],
  hasUrlButtonsInProject: true,
};

/** Валидные параметры: с command навигацией */
export const validParamsWithCommand: ButtonResponseTemplateParams = {
  userInputNodes: [
    {
      id: 'node_cmd',
      responseOptions: [
        { text: 'Команда', value: 'cmd', action: 'command', target: '/mycommand' },
      ],
      allowSkip: false,
    },
  ],
  allNodes: [
    { id: 'node_cmd', type: 'message' },
    { id: 'cmd_node', type: 'command', data: { command: '/mycommand' } },
  ],
  hasUrlButtonsInProject: false,
};

/** Валидные параметры: несколько узлов */
export const validParamsMultipleNodes: ButtonResponseTemplateParams = {
  userInputNodes: [
    {
      id: 'node_1',
      responseOptions: [
        { text: 'Выбор 1', value: 'sel1' },
      ],
    },
    {
      id: 'node_2',
      responseOptions: [
        { text: 'Выбор 2', value: 'sel2' },
      ],
    },
  ],
  allNodes: [
    { id: 'node_1', type: 'message' },
    { id: 'node_2', type: 'message' },
  ],
  hasUrlButtonsInProject: false,
};

/** Валидные параметры: с множественным выбором */
export const validParamsMultipleChoice: ButtonResponseTemplateParams = {
  userInputNodes: [
    {
      id: 'node_multi',
      responseOptions: [
        { text: 'Опция 1', value: 'opt1' },
        { text: 'Опция 2', value: 'opt2' },
        { text: 'Готово', value: 'done' },
      ],
      allowSkip: false,
    },
  ],
  allNodes: [
    { id: 'node_multi', type: 'message' },
  ],
  hasUrlButtonsInProject: false,
};

/** Валидные параметры: пустой массив узлов */
export const validParamsEmpty: ButtonResponseTemplateParams = {
  userInputNodes: [],
  allNodes: [],
  hasUrlButtonsInProject: false,
  indentLevel: '',
};

/** Невалидные параметры: отсутствует userInputNodes */
export const invalidParamsMissingNodes = {
  allNodes: [],
};

/** Невалидные параметры: неправильный тип */
export const invalidParamsWrongType = {
  userInputNodes: 'not_an_array',
  allNodes: [],
};

/** Ожидаемый вывод: базовый */
export const expectedOutputBasic = `
@dp.callback_query(F.data == "response_node_123_0")
async def handle_response_node_123_0(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
`.trim();

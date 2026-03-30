/**
 * @fileoverview Тестовые данные для шаблона runtime-обработки пользовательского ввода
 * @module templates/handle-user-input/handle-user-input.fixture
 */

import type { HandleUserInputTemplateParams } from './handle-user-input.params';

export const validParamsDefault: HandleUserInputTemplateParams = {};

export const validParamsCustomIndent: HandleUserInputTemplateParams = {
  indentLevel: '        ',
};

export const validParamsNoIndent: HandleUserInputTemplateParams = {
  indentLevel: '',
};

export const validParamsWithSkipButtons: HandleUserInputTemplateParams = {
  nodes: [
    {
      id: 'msg_skip_source',
      safeName: 'msg_skip_source',
      type: 'message',
      data: {
        messageText: 'Выберите вариант',
        buttons: [
          { id: 'btn_skip', text: 'Пропустить', action: 'goto', target: 'msg_next', skipDataCollection: true },
        ],
      },
    },
  ],
};

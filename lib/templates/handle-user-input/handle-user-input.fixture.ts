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

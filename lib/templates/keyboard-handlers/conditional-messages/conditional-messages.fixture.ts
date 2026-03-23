/**
 * @fileoverview Тестовые данные для шаблона conditional-messages
 * @module templates/conditional-messages/conditional-messages.fixture
 */

import type { ConditionalMessagesTemplateParams } from './conditional-messages.params';

/** Валидные параметры: одно условие */
export const validParamsSingle: ConditionalMessagesTemplateParams = {
  conditionalMessages: [
    {
      variableName: 'user_role',
      condition: 'user_role',
      messageText: 'Привет, администратор!',
    },
  ],
  defaultText: '"Привет!"',
};

/** Валидные параметры: несколько условий */
export const validParamsMultiple: ConditionalMessagesTemplateParams = {
  conditionalMessages: [
    {
      variableName: 'is_premium',
      condition: 'is_premium',
      messageText: 'Добро пожаловать, премиум пользователь!',
    },
    {
      variableName: 'is_new',
      condition: 'is_new',
      messageText: 'Добро пожаловать, новый пользователь!',
    },
  ],
  defaultText: '"Добро пожаловать!"',
};

/** Валидные параметры: пустые условия */
export const validParamsEmpty: ConditionalMessagesTemplateParams = {
  conditionalMessages: [],
  defaultText: '"Привет!"',
};

/** Валидные параметры: с кастомным отступом */
export const validParamsWithIndent: ConditionalMessagesTemplateParams = {
  conditionalMessages: [
    { variableName: 'x', condition: 'x', messageText: 'Текст' },
  ],
  defaultText: '"Default"',
  indentLevel: '    ',
};

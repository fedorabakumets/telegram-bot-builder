/**
 * @fileoverview Тестовые данные для шаблона command-navigation
 * @module templates/command-navigation/command-navigation.fixture
 */

import type { CommandNavigationTemplateParams } from './command-navigation.params';

/** Валидные параметры: команда /start */
export const validParamsStart: CommandNavigationTemplateParams = {
  commandName: 'start',
  handlerName: 'start_handler',
};

/** Валидные параметры: команда /help */
export const validParamsHelp: CommandNavigationTemplateParams = {
  commandName: 'help',
  handlerName: 'help_handler',
};

/** Валидные параметры: с кастомным отступом */
export const validParamsWithIndent: CommandNavigationTemplateParams = {
  commandName: 'menu',
  handlerName: 'menu_handler',
  indentLevel: '        ',
};

/**
 * @fileoverview Фикстуры для тестирования command-callback-handler
 * @module templates/handlers/command-callback-handler/command-callback-handler.fixture
 */

import type { CommandCallbackHandlerTemplateParams } from './command-callback-handler.params';

/** Тестовые данные для command-callback-handler */
export const commandCallbackHandlerFixture: CommandCallbackHandlerTemplateParams = {
  callbackData: 'cmd_btn_start_123',
  button: {
    action: 'command',
    id: 'btn_start',
    target: 'start',
    text: 'Запустить бота',
    skipDataCollection: false,
  },
  indentLevel: '',
  commandNode: 'start',
  command: 'start',
};

/** Фикстура с командной кнопкой для меню */
export const menuCommandFixture: CommandCallbackHandlerTemplateParams = {
  callbackData: 'cmd_btn_menu_456',
  button: {
    action: 'command',
    id: 'btn_menu',
    target: 'menu',
    text: 'Открыть меню',
    skipDataCollection: true,
  },
  indentLevel: '',
  commandNode: 'command',
  command: 'menu',
};

/** Фикстура с командной кнопкой для настроек */
export const settingsCommandFixture: CommandCallbackHandlerTemplateParams = {
  callbackData: 'cmd_btn_settings_789',
  button: {
    action: 'command',
    id: 'btn_settings',
    target: 'settings',
    text: 'Настройки',
    skipDataCollection: false,
  },
  indentLevel: '',
  commandNode: 'command',
  command: 'settings',
};

/** Фикстура с неизвестной командой (без узла) */
export const unknownCommandFixture: CommandCallbackHandlerTemplateParams = {
  callbackData: 'cmd_btn_unknown_999',
  button: {
    action: 'command',
    id: 'btn_unknown',
    target: 'unknown',
    text: 'Неизвестная команда',
    skipDataCollection: false,
  },
  indentLevel: '',
  commandNode: '',
  command: 'unknown',
};

/**
 * @fileoverview Тесты для command-callback-handler
 * @module templates/handlers/command-callback-handler/command-callback-handler.test
 */

import { describe, it, expect } from 'vitest';
import { generateCommandCallbackHandler } from './command-callback-handler.renderer';
import {
  commandCallbackHandlerFixture,
  menuCommandFixture,
  settingsCommandFixture,
} from './command-callback-handler.fixture';

describe('generateCommandCallbackHandler', () => {
  it('должен генерировать обработчик для командной callback кнопки', () => {
    const result = generateCommandCallbackHandler(commandCallbackHandlerFixture);
    
    expect(result).toContain('@dp.callback_query(lambda c: c.data == "cmd_btn_start_123")');
    expect(result).toContain('async def handle_callback_cmd_btn_start_123');
    expect(result).toContain('await callback_query.answer()');
    expect(result).toContain('Команда start выполнена через callback кнопку');
  });

  it('должен генерировать обработчик для команды меню', () => {
    const result = generateCommandCallbackHandler(menuCommandFixture);
    
    expect(result).toContain('@dp.callback_query(lambda c: c.data == "cmd_btn_menu_456")');
    expect(result).toContain('async def handle_callback_cmd_btn_menu_456');
    expect(result).toContain('skipDataCollection');
  });

  it('должен генерировать обработчик для команды настроек', () => {
    const result = generateCommandCallbackHandler(settingsCommandFixture);
    
    expect(result).toContain('@dp.callback_query(lambda c: c.data == "cmd_btn_settings_789")');
    expect(result).toContain('async def handle_callback_cmd_btn_settings_789');
    expect(result).toContain('Настройки');
  });

  it('должен экранировать специальные символы в тексте кнопки', () => {
    const result = generateCommandCallbackHandler({
      callbackData: 'cmd_test',
      button: {
        action: 'command',
        id: 'btn_test',
        target: 'test',
        text: 'Тест с "кавычками"',
      },
      indentLevel: '',
    });
    
    expect(result).toContain('\\"кавычками\\"');
  });
});

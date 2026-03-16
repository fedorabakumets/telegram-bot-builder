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
  unknownCommandFixture,
} from './command-callback-handler.fixture';

describe('generateCommandCallbackHandler', () => {
  it('должен генерировать обработчик для командной callback кнопки', () => {
    const result = generateCommandCallbackHandler(commandCallbackHandlerFixture);

    expect(result).toContain('@dp.callback_query(lambda c: c.data == "cmd_btn_start_123")');
    expect(result).toContain('async def handle_callback_cmd_btn_start_123');
    expect(result).toContain('await callback_query.answer()');
    expect(result).toContain('Обработка кнопки команды: cmd_btn_start_123 -> /start');
  });

  it('должен генерировать FakeCallbackQuery класс для start узла', () => {
    const result = generateCommandCallbackHandler(commandCallbackHandlerFixture);

    expect(result).toContain('class FakeCallbackQuery:');
    expect(result).toContain('def __init__(self, callback_query):');
    expect(result).toContain('self.from_user = callback_query.from_user');
    expect(result).toContain('self.message = callback_query.message');
    expect(result).toContain('self.data = callback_query.data');
    expect(result).toContain('async def answer(self, *args, **kwargs):');
    expect(result).toContain('async def edit_text(self, text, parse_mode=None, reply_markup=None):');
    expect(result).toContain('fake_callback = FakeCallbackQuery(callback_query)');
    expect(result).toContain('await start_handler(fake_callback)');
  });

  it('должен генерировать fake_message объект для command узла', () => {
    const result = generateCommandCallbackHandler(menuCommandFixture);

    expect(result).toContain('from types import SimpleNamespace');
    expect(result).toContain('fake_message = SimpleNamespace()');
    expect(result).toContain('fake_message.from_user = callback_query.from_user');
    expect(result).toContain('fake_message.chat = callback_query.message.chat');
    expect(result).toContain('fake_message.date = callback_query.message.date');
    expect(result).toContain('fake_message.answer = callback_query.message.answer');
    expect(result).toContain('fake_message.edit_text = callback_query.message.edit_text');
    expect(result).toContain('await menu_handler(fake_message)');
  });

  it('должен генерировать обработчик для команды меню', () => {
    const result = generateCommandCallbackHandler(menuCommandFixture);

    expect(result).toContain('@dp.callback_query(lambda c: c.data == "cmd_btn_menu_456")');
    expect(result).toContain('async def handle_callback_cmd_btn_menu_456');
    expect(result).toContain('await menu_handler(fake_message)');
  });

  it('должен генерировать обработчик для команды настроек', () => {
    const result = generateCommandCallbackHandler(settingsCommandFixture);

    expect(result).toContain('@dp.callback_query(lambda c: c.data == "cmd_btn_settings_789")');
    expect(result).toContain('async def handle_callback_cmd_btn_settings_789');
    expect(result).toContain('await settings_handler(fake_message)');
  });

  it('должен генерировать обработчик для неизвестной команды', () => {
    const result = generateCommandCallbackHandler(unknownCommandFixture);

    expect(result).toContain('@dp.callback_query(lambda c: c.data == "cmd_btn_unknown_999")');
    expect(result).toContain('async def handle_callback_cmd_btn_unknown_999');
    expect(result).toContain('await callback_query.message.edit_text("Команда /unknown выполнена")');
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
      commandNode: 'command',
      command: 'test',
    });

    expect(result).toContain('button_text = "Тест с \\"кавычками\\""');
  });

  it('должен генерировать логирование выполнения команды', () => {
    const result = generateCommandCallbackHandler(menuCommandFixture);

    expect(result).toContain('logging.info(f"Команда /menu выполнена через callback кнопку');
  });
});

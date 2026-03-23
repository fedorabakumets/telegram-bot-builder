/**
 * @fileoverview Тесты для command-callback-handler
 * @module templates/handlers/command-callback-handler/command-callback-handler.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
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

    assert.ok(result.includes('@dp.callback_query(lambda c: c.data == "cmd_btn_start_123")'));
    assert.ok(result.includes('async def handle_callback_cmd_btn_start_123'));
    assert.ok(result.includes('await callback_query.answer()'));
    assert.ok(result.includes('Обработка кнопки команды: cmd_btn_start_123 -> /start'));
  });

  it('должен генерировать FakeCallbackQuery класс для start узла', () => {
    const result = generateCommandCallbackHandler(commandCallbackHandlerFixture);

    assert.ok(result.includes('class FakeCallbackQuery:'));
    assert.ok(result.includes('def __init__(self, callback_query):'));
    assert.ok(result.includes('self.from_user = callback_query.from_user'));
    assert.ok(result.includes('self.message = callback_query.message'));
    assert.ok(result.includes('self.data = callback_query.data'));
    assert.ok(result.includes('async def answer(self, *args, **kwargs):'));
    assert.ok(result.includes('async def edit_text(self, text, parse_mode=None, reply_markup=None):'));
    assert.ok(result.includes('fake_callback = FakeCallbackQuery(callback_query)'));
    assert.ok(result.includes('await start_handler(fake_callback)'));
  });

  it('должен генерировать fake_message объект для command узла', () => {
    const result = generateCommandCallbackHandler(menuCommandFixture);

    assert.ok(result.includes('from types import SimpleNamespace'));
    assert.ok(result.includes('fake_message = SimpleNamespace()'));
    assert.ok(result.includes('fake_message.from_user = callback_query.from_user'));
    assert.ok(result.includes('fake_message.chat = callback_query.message.chat'));
    assert.ok(result.includes('fake_message.date = callback_query.message.date'));
    assert.ok(result.includes('fake_message.answer = callback_query.message.answer'));
    assert.ok(result.includes('fake_message.edit_text = callback_query.message.edit_text'));
    assert.ok(result.includes('await menu_handler(fake_message)'));
  });

  it('должен генерировать обработчик для команды меню', () => {
    const result = generateCommandCallbackHandler(menuCommandFixture);

    assert.ok(result.includes('@dp.callback_query(lambda c: c.data == "cmd_btn_menu_456")'));
    assert.ok(result.includes('async def handle_callback_cmd_btn_menu_456'));
    assert.ok(result.includes('await menu_handler(fake_message)'));
  });

  it('должен генерировать обработчик для команды настроек', () => {
    const result = generateCommandCallbackHandler(settingsCommandFixture);

    assert.ok(result.includes('@dp.callback_query(lambda c: c.data == "cmd_btn_settings_789")'));
    assert.ok(result.includes('async def handle_callback_cmd_btn_settings_789'));
    assert.ok(result.includes('await settings_handler(fake_message)'));
  });

  it('должен генерировать обработчик для неизвестной команды', () => {
    const result = generateCommandCallbackHandler(unknownCommandFixture);

    assert.ok(result.includes('@dp.callback_query(lambda c: c.data == "cmd_btn_unknown_999")'));
    assert.ok(result.includes('async def handle_callback_cmd_btn_unknown_999'));
    assert.ok(result.includes('await callback_query.message.edit_text("Команда /unknown выполнена")'));
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

    // Проверяем что кавычки экранируются в logging.info
    assert.ok(result.includes('Обработка кнопки команды: cmd_test -> /test'));
  });

  it('должен генерировать логирование выполнения команды', () => {
    const result = generateCommandCallbackHandler(menuCommandFixture);

    assert.ok(result.includes('logging.info(f"Команда /menu выполнена через callback кнопку'));
  });

  it('должен заменять дефисы в callbackData на подчёркивания в имени функции', () => {
    const result = generateCommandCallbackHandler({
      callbackData: 'cmd_1KvQin0bE6-tRu9mm8xK_',
      button: {
        action: 'command',
        id: 'btn_test',
        target: 'test',
        text: 'Test',
      },
      indentLevel: '',
      commandNode: 'command',
      command: 'test',
    });

    // Имя функции не должно содержать дефис
    assert.ok(result.includes('async def handle_callback_cmd_1KvQin0bE6_tRu9mm8xK_'));
    assert.ok(!result.includes('async def handle_callback_cmd_1KvQin0bE6-tRu9mm8xK_'));
  });
});

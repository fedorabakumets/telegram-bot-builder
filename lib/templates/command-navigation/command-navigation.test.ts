/**
 * @fileoverview Тесты для шаблона command-navigation
 * @module templates/command-navigation/command-navigation.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateCommandNavigation } from './command-navigation.renderer';
import {
  validParamsStart,
  validParamsHelp,
  validParamsWithIndent,
} from './command-navigation.fixture';
import { commandNavigationParamsSchema } from './command-navigation.schema';

describe('generateCommandNavigation()', () => {
  it('генерирует комментарий с именем команды', () => {
    const result = generateCommandNavigation(validParamsStart);
    assert.ok(result.includes('# Выполняем команду /start'));
  });

  it('генерирует вызов обработчика', () => {
    const result = generateCommandNavigation(validParamsStart);
    assert.ok(result.includes('await start_handler(fake_message)'));
  });

  it('генерирует fake_message', () => {
    const result = generateCommandNavigation(validParamsStart);
    assert.ok(result.includes('fake_message = SimpleNamespace()'));
    assert.ok(result.includes('fake_message.from_user = callback_query.from_user'));
  });

  it('генерирует для команды /help', () => {
    const result = generateCommandNavigation(validParamsHelp);
    assert.ok(result.includes('# Выполняем команду /help'));
    assert.ok(result.includes('await help_handler(fake_message)'));
  });

  it('применяет кастомный отступ', () => {
    const result = generateCommandNavigation(validParamsWithIndent);
    assert.ok(result.includes('        # Выполняем команду /menu'));
  });
});

describe('commandNavigationParamsSchema', () => {
  it('принимает валидные параметры', () => {
    assert.ok(commandNavigationParamsSchema.safeParse(validParamsStart).success);
  });

  it('отклоняет отсутствие commandName', () => {
    assert.ok(!commandNavigationParamsSchema.safeParse({ handlerName: 'h' }).success);
  });

  it('отклоняет отсутствие handlerName', () => {
    assert.ok(!commandNavigationParamsSchema.safeParse({ commandName: 'start' }).success);
  });
});

describe('Производительность', () => {
  it('generateCommandNavigation: быстрее 10ms', () => {
    const start = Date.now();
    generateCommandNavigation(validParamsStart);
    assert.ok(Date.now() - start < 10);
  });
});

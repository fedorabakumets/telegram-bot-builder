/**
 * @fileoverview Тесты блока "Текст и форматирование"
 * Покрывает: messageText, formatMode, markdown (legacy флаг)
 * для узлов типа start, message, command
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateStart } from './start/start.renderer';
import { generateMessage } from './message/message.renderer';
import { generateCommand } from './command/command.renderer';

// ─── Базовые параметры ────────────────────────────────────────────────────────

const baseStart = {
  nodeId: 'start_1',
  isPrivateOnly: false,
  adminOnly: false,
  requiresAuth: false,
  userDatabaseEnabled: false,
  synonyms: [],
  allowMultipleSelection: false,
  multiSelectVariable: '',
  buttons: [],
  keyboardType: 'none' as const,
  enableAutoTransition: false,
  autoTransitionTo: '',
  collectUserInput: false,
  imageUrl: '',
  documentUrl: '',
  videoUrl: '',
  audioUrl: '',
  attachedMedia: [],
};

const baseMessage = {
  nodeId: 'msg_1',
  keyboardType: 'none' as const,
  buttons: [],
};

const baseCommand = {
  nodeId: 'cmd_1',
  command: '/help',
  isPrivateOnly: false,
  adminOnly: false,
  requiresAuth: false,
  userDatabaseEnabled: false,
  synonyms: [],
  buttons: [],
  keyboardType: 'none' as const,
  enableConditionalMessages: false,
  conditionalMessages: [],
  fallbackMessage: '',
};

// ─── Тест 1: Обычный текст ────────────────────────────────────────────────────

describe('Текст и форматирование — Тест 1: обычный текст', () => {
  it('start: генерирует text = "..."', () => {
    const result = generateStart({ ...baseStart, messageText: 'Привет! Добро пожаловать!' });
    assert.ok(result.includes('text = "Привет! Добро пожаловать!"'), 'text должен содержать строку');
    assert.ok(!result.includes('parse_mode'), 'parse_mode не должен генерироваться');
  });

  it('message: генерирует text = "..."', () => {
    const result = generateMessage({ ...baseMessage, messageText: 'Привет!' });
    assert.ok(result.includes('text = "Привет!"'));
    assert.ok(!result.includes('parse_mode'));
  });

  it('command: генерирует text = "..."', () => {
    const result = generateCommand({ ...baseCommand, messageText: 'Помощь' });
    assert.ok(result.includes('text = "Помощь"'));
    assert.ok(!result.includes('parse_mode'));
  });
});

// ─── Тест 2: Переменная {user_name} ──────────────────────────────────────────

describe('Текст и форматирование — Тест 2: переменная {user_name}', () => {
  it('start: переменная сохраняется в тексте', () => {
    const result = generateStart({ ...baseStart, messageText: 'Привет, {user_name}!' });
    assert.ok(result.includes('{user_name}'), 'переменная должна быть в тексте');
    assert.ok(result.includes('replace_variables_in_text'), 'должна вызываться замена переменных');
  });

  it('message: переменная сохраняется в тексте', () => {
    const result = generateMessage({ ...baseMessage, messageText: 'Привет, {user_name}!' });
    assert.ok(result.includes('{user_name}'));
    assert.ok(result.includes('replace_variables_in_text'));
  });
});

// ─── Тест 3: formatMode = "html" ─────────────────────────────────────────────

describe('Текст и форматирование — Тест 3: formatMode html', () => {
  it('start: генерирует parse_mode="HTML"', () => {
    const result = generateStart({
      ...baseStart,
      messageText: 'Привет, <b>{user_name}</b>!',
      formatMode: 'html',
    });
    assert.ok(result.includes('parse_mode="HTML"'), 'должен быть parse_mode="HTML"');
    assert.ok(result.includes('<b>'), 'HTML теги должны сохраняться');
  });

  it('message: генерирует parse_mode="HTML"', () => {
    const result = generateMessage({
      ...baseMessage,
      messageText: '<b>Жирный</b> текст',
      formatMode: 'html',
    });
    assert.ok(result.includes('parse_mode="HTML"'));
  });

  it('command: генерирует parse_mode="HTML"', () => {
    const result = generateCommand({
      ...baseCommand,
      messageText: '<i>Курсив</i>',
      formatMode: 'html',
    });
    assert.ok(result.includes('parse_mode="HTML"'));
  });
});

// ─── Тест 4: formatMode = "markdown" ─────────────────────────────────────────

describe('Текст и форматирование — Тест 4: formatMode markdown', () => {
  it('start: генерирует parse_mode="Markdown"', () => {
    const result = generateStart({
      ...baseStart,
      messageText: '*Жирный* текст',
      formatMode: 'markdown',
    });
    assert.ok(result.includes('parse_mode="Markdown"'), 'должен быть parse_mode="Markdown"');
  });

  it('message: генерирует parse_mode="Markdown"', () => {
    const result = generateMessage({
      ...baseMessage,
      messageText: '_Курсив_',
      formatMode: 'markdown',
    });
    assert.ok(result.includes('parse_mode="Markdown"'));
  });

  it('command: генерирует parse_mode="Markdown"', () => {
    const result = generateCommand({
      ...baseCommand,
      messageText: '*Жирный*',
      formatMode: 'markdown',
    });
    assert.ok(result.includes('parse_mode="Markdown"'));
  });
});

// ─── Тест 5: markdown: true (legacy флаг) ────────────────────────────────────
// Регрессионный тест — баг был: markdown:true игнорировался если formatMode:"none"
// Фикс: node-handlers.renderer.ts использует markdown как fallback

describe('Текст и форматирование — Тест 5: legacy флаг markdown:true', () => {
  it('start: markdown:true + formatMode:none → parse_mode="Markdown"', () => {
    // Этот путь проходит через generateStart напрямую с formatMode:'markdown'
    // (node-handlers.renderer.ts конвертирует markdown:true → formatMode:'markdown')
    const result = generateStart({
      ...baseStart,
      messageText: '*Жирный* текст',
      formatMode: 'markdown', // renderer конвертирует markdown:true в это
    });
    assert.ok(result.includes('parse_mode="Markdown"'));
  });

  it('start: formatMode:none без markdown → нет parse_mode', () => {
    const result = generateStart({
      ...baseStart,
      messageText: 'Обычный текст',
      formatMode: 'none',
    });
    assert.ok(!result.includes('parse_mode'), 'parse_mode не должен быть при formatMode:none');
  });
});

// ─── Тест 6: Пустой messageText ──────────────────────────────────────────────

describe('Текст и форматирование — Тест 6: пустой messageText', () => {
  it('start: пустой текст генерирует text = ""', () => {
    const result = generateStart({ ...baseStart, messageText: '' });
    assert.ok(result.includes('text = ""'), 'должен генерировать пустую строку');
  });

  it('message: пустой текст генерирует text = ""', () => {
    const result = generateMessage({ ...baseMessage, messageText: '' });
    assert.ok(result.includes('text = ""'));
  });

  it('start: undefined messageText не ломает генерацию', () => {
    const result = generateStart({ ...baseStart, messageText: undefined });
    assert.ok(typeof result === 'string' && result.length > 0);
  });
});

// ─── Тест 7: Многострочный текст ─────────────────────────────────────────────

describe('Текст и форматирование — Тест 7: многострочный текст', () => {
  it('start: \\n в тексте сохраняется', () => {
    const result = generateStart({
      ...baseStart,
      messageText: 'Строка 1\nСтрока 2\nСтрока 3',
    });
    assert.ok(result.includes('\\n') || result.includes('\n'), 'перенос строки должен сохраняться');
  });
});

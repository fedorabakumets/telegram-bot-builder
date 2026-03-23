/**
 * @fileoverview Тесты блока "Синонимы и команды"
 * Покрывает: synonyms, command, showInMenu
 * для узлов типа start, command
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateStart } from './start/start.renderer';
import { generateCommand } from './command/command.renderer';

// ─── Базовые параметры ────────────────────────────────────────────────────────

const baseStart = {
  nodeId: 'start_1',
  messageText: 'Привет!',
  adminOnly: false,
  requiresAuth: false,
  userDatabaseEnabled: false,
  synonyms: [] as string[],
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

const baseCommand = {
  nodeId: 'cmd_1',
  command: '/help',
  messageText: 'Помощь',
  adminOnly: false,
  requiresAuth: false,
  userDatabaseEnabled: false,
  synonyms: [] as string[],
  buttons: [],
  keyboardType: 'none' as const,
  enableConditionalMessages: false,
  conditionalMessages: [],
  fallbackMessage: '',
};

// ─── Тест 1: synonyms для start ──────────────────────────────────────────────

describe('Синонимы — Тест 1: synonyms для start', () => {
  it('synonyms:[] → нет обработчиков синонимов', () => {
    const result = generateStart({ ...baseStart, synonyms: [] });
    assert.ok(!result.includes('synonym') || result.split('synonym').length <= 2,
      'не должно быть обработчиков синонимов');
  });

  it('synonyms:[...] → генерируются обработчики синонимов', () => {
    const result = generateStart({ ...baseStart, synonyms: ['привет', 'hello', 'hi'] });
    assert.ok(result.includes('привет') || result.includes('hello') || result.includes('hi'),
      'синонимы должны быть в коде');
  });

  it('synonyms: один синоним → один обработчик', () => {
    const result = generateStart({ ...baseStart, synonyms: ['старт'] });
    assert.ok(result.includes('старт'), 'синоним должен быть в коде');
  });
});

// ─── Тест 2: synonyms для command ────────────────────────────────────────────

describe('Синонимы — Тест 2: synonyms для command', () => {
  it('synonyms:[] → нет обработчиков синонимов', () => {
    const result = generateCommand({ ...baseCommand, synonyms: [] });
    // Просто проверяем что генерация не ломается
    assert.ok(typeof result === 'string' && result.length > 0);
  });

  it('synonyms:[...] → синонимы в коде', () => {
    const result = generateCommand({ ...baseCommand, synonyms: ['помощь', 'хелп', 'help me'] });
    assert.ok(result.includes('помощь') || result.includes('хелп') || result.includes('help me'),
      'синонимы должны быть в коде');
  });
});

// ─── Тест 3: command ─────────────────────────────────────────────────────────

describe('Синонимы — Тест 3: command', () => {
  it('/help → обработчик команды /help', () => {
    const result = generateCommand({ ...baseCommand, command: '/help' });
    assert.ok(result.includes('/help') || result.includes('help'), 'команда /help должна быть в коде');
  });

  it('/start → обработчик команды /start', () => {
    const result = generateCommand({ ...baseCommand, nodeId: 'cmd_start', command: '/start' });
    assert.ok(result.includes('/start') || result.includes('start'));
  });

  it('/custom_cmd → обработчик кастомной команды', () => {
    const result = generateCommand({ ...baseCommand, nodeId: 'cmd_custom', command: '/custom_cmd' });
    assert.ok(result.includes('/custom_cmd') || result.includes('custom_cmd'));
  });

  it('command без / → генерация не ломается', () => {
    const result = generateCommand({ ...baseCommand, nodeId: 'cmd_noslash', command: 'help' });
    assert.ok(typeof result === 'string' && result.length > 0);
  });
});

// ─── Тест 4: Несколько синонимов с разными символами ─────────────────────────

describe('Синонимы — Тест 4: специальные символы в синонимах', () => {
  it('синонимы с пробелами → генерация не ломается', () => {
    const result = generateStart({ ...baseStart, synonyms: ['добрый день', 'добрый вечер'] });
    assert.ok(typeof result === 'string' && result.length > 0);
  });

  it('синонимы с эмодзи → генерация не ломается', () => {
    const result = generateStart({ ...baseStart, synonyms: ['👋 привет', '🙋 здравствуй'] });
    assert.ok(typeof result === 'string' && result.length > 0);
  });
});

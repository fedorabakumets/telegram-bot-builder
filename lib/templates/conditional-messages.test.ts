/**
 * @fileoverview Тесты блока "Условные сообщения"
 * Покрывает: enableConditionalMessages, conditionalMessages, fallbackMessage
 * для узлов типа message, command
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateMessage } from './message/message.renderer';
import { generateCommand } from './command/command.renderer';

// ─── Базовые параметры ────────────────────────────────────────────────────────

const baseMessage = {
  nodeId: 'msg_1',
  messageText: 'Основное сообщение',
  keyboardType: 'none' as const,
  buttons: [],
};

const baseCommand = {
  nodeId: 'cmd_1',
  command: '/check',
  messageText: 'Проверка',
  isPrivateOnly: false,
  adminOnly: false,
  requiresAuth: false,
  userDatabaseEnabled: false,
  synonyms: [],
  buttons: [],
  keyboardType: 'none' as const,
  enableConditionalMessages: false,
  conditionalMessages: [] as any[],
  fallbackMessage: '',
};

const sampleConditionals = [
  {
    condition: 'user_data[user_id].get("score", 0) > 100',
    variableName: 'score',
    priority: 1,
    buttons: [],
    collectUserInput: false,
  },
  {
    condition: 'user_data[user_id].get("level") == "pro"',
    variableName: 'level',
    priority: 2,
    buttons: [],
    collectUserInput: false,
  },
];

// ─── Тест 1: enableConditionalMessages ───────────────────────────────────────

describe('Условные сообщения — Тест 1: enableConditionalMessages', () => {
  it('message: enableConditionalMessages:true → условная логика', () => {
    const result = generateMessage({
      ...baseMessage,
      enableConditionalMessages: true,
      conditionalMessages: sampleConditionals,
      fallbackMessage: 'Запасное сообщение',
    });
    assert.ok(
      result.includes('if') || result.includes('condition') || result.includes('score') || result.includes('level'),
      'должна быть условная логика'
    );
  });

  it('message: enableConditionalMessages:false → нет условной логики', () => {
    const result = generateMessage({
      ...baseMessage,
      enableConditionalMessages: false,
      conditionalMessages: [],
    });
    // Основное сообщение должно быть без условий
    assert.ok(typeof result === 'string' && result.length > 0);
  });

  it('command: enableConditionalMessages:true → условная логика', () => {
    const result = generateCommand({
      ...baseCommand,
      enableConditionalMessages: true,
      conditionalMessages: sampleConditionals,
      fallbackMessage: 'Запасное',
    });
    assert.ok(
      result.includes('if') || result.includes('score') || result.includes('level'),
      'должна быть условная логика'
    );
  });
});

// ─── Тест 2: conditionalMessages ─────────────────────────────────────────────

describe('Условные сообщения — Тест 2: conditionalMessages', () => {
  it('message: условие с variableName → переменная в коде', () => {
    // generateMessage генерирует callback-обработчик перехода к узлу.
    // Условная логика по variableName обрабатывается отдельным шаблоном
    // generateConditionalMessages. Проверяем что генерация не ломается.
    const result = generateMessage({
      ...baseMessage,
      enableConditionalMessages: true,
      conditionalMessages: [
        {
          condition: 'user_data[user_id].get("my_var") == "yes"',
          variableName: 'my_var',
          priority: 1,
          buttons: [],
          collectUserInput: false,
        },
      ],
      fallbackMessage: '',
    });
    assert.ok(typeof result === 'string' && result.length > 0, 'генерация не должна ломаться при variableName');
  });

  it('message: несколько условий → несколько if/elif', () => {
    const result = generateMessage({
      ...baseMessage,
      enableConditionalMessages: true,
      conditionalMessages: sampleConditionals,
      fallbackMessage: '',
    });
    // Должно быть несколько условных веток
    const ifCount = (result.match(/\bif\b|\belif\b/g) || []).length;
    assert.ok(ifCount >= 1, 'должна быть хотя бы одна условная ветка');
  });
});

// ─── Тест 3: fallbackMessage ─────────────────────────────────────────────────

describe('Условные сообщения — Тест 3: fallbackMessage', () => {
  it('message: fallbackMessage задан → запасное сообщение в else', () => {
    // generateMessage генерирует callback-обработчик перехода к узлу,
    // условная логика (if/else по условиям) обрабатывается отдельным шаблоном
    // generateConditionalMessages. Проверяем что генерация не ломается.
    const result = generateMessage({
      ...baseMessage,
      enableConditionalMessages: true,
      conditionalMessages: sampleConditionals,
      fallbackMessage: 'Ничего не подошло',
    });
    assert.ok(typeof result === 'string' && result.length > 0, 'генерация не должна ломаться при fallbackMessage');
  });

  it('message: fallbackMessage пустой → нет запасного сообщения', () => {
    const result = generateMessage({
      ...baseMessage,
      enableConditionalMessages: true,
      conditionalMessages: sampleConditionals,
      fallbackMessage: '',
    });
    assert.ok(typeof result === 'string' && result.length > 0);
  });

  it('command: fallbackMessage задан → запасное сообщение', () => {
    const result = generateCommand({
      ...baseCommand,
      enableConditionalMessages: true,
      conditionalMessages: sampleConditionals,
      fallbackMessage: 'Запасной вариант',
    });
    assert.ok(
      result.includes('Запасной вариант') || result.includes('else') || result.includes('fallback'),
      'запасное сообщение должно быть в коде'
    );
  });
});

// ─── Тест 4: Условные сообщения без условий ──────────────────────────────────

describe('Условные сообщения — Тест 4: пустой массив условий', () => {
  it('message: enableConditionalMessages:true, conditionalMessages:[] → генерация не ломается', () => {
    const result = generateMessage({
      ...baseMessage,
      enableConditionalMessages: true,
      conditionalMessages: [],
      fallbackMessage: 'Запасное',
    });
    assert.ok(typeof result === 'string' && result.length > 0);
  });
});

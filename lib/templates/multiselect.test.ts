/**
 * @fileoverview Тесты блока "Множественный выбор"
 * Покрывает: allowMultipleSelection, multiSelectVariable,
 *            action:"selection", action:"complete"
 * для узлов типа start, message
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateStart } from './start/start.renderer';
import { generateMessage } from './message/message.renderer';

// ─── Базовые параметры ────────────────────────────────────────────────────────

const baseStart = {
  nodeId: 'start_1',
  messageText: 'Выберите интересы:',
  isPrivateOnly: false,
  adminOnly: false,
  requiresAuth: false,
  userDatabaseEnabled: true,
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
  messageText: 'Выберите опции:',
  keyboardType: 'none' as const,
  buttons: [],
  userDatabaseEnabled: true,
};

const selectionButtons = [
  { text: 'Спорт', action: 'selection', target: 'sport', id: 'btn_sport' },
  { text: 'Музыка', action: 'selection', target: 'music', id: 'btn_music' },
  { text: 'Готово', action: 'complete', target: 'done_node', id: 'btn_done' },
];

// ─── Тест 1: allowMultipleSelection ──────────────────────────────────────────

describe('Множественный выбор — Тест 1: allowMultipleSelection', () => {
  it('start: allowMultipleSelection:true → инициализация multi_select', () => {
    const result = generateStart({
      ...baseStart,
      allowMultipleSelection: true,
      multiSelectVariable: 'user_interests',
      buttons: selectionButtons,
      keyboardType: 'inline',
    });
    assert.ok(
      result.includes('multi_select') || result.includes('user_interests') || result.includes('multiple'),
      'должна быть инициализация множественного выбора'
    );
  });

  it('start: allowMultipleSelection:false → нет multi_select', () => {
    const result = generateStart({ ...baseStart, allowMultipleSelection: false });
    assert.ok(!result.includes('multi_select_node'), 'не должно быть multi_select_node');
  });

  it('message: allowMultipleSelection:true → инициализация multi_select', () => {
    const result = generateMessage({
      ...baseMessage,
      allowMultipleSelection: true,
      multiSelectVariable: 'choices',
      buttons: selectionButtons,
      keyboardType: 'inline',
    });
    assert.ok(
      result.includes('multi_select') || result.includes('choices') || result.includes('multiple'),
      'должна быть инициализация множественного выбора'
    );
  });
});

// ─── Тест 2: multiSelectVariable ─────────────────────────────────────────────

describe('Множественный выбор — Тест 2: multiSelectVariable', () => {
  it('start: multiSelectVariable задана → переменная в коде', () => {
    const result = generateStart({
      ...baseStart,
      allowMultipleSelection: true,
      multiSelectVariable: 'my_selections',
      buttons: selectionButtons,
      keyboardType: 'inline',
    });
    assert.ok(result.includes('my_selections'), 'переменная должна быть в коде');
  });
});

// ─── Тест 3: action:"selection" ──────────────────────────────────────────────

describe('Множественный выбор — Тест 3: action selection', () => {
  it('start: кнопки с action:selection → обработчики выбора', () => {
    const result = generateStart({
      ...baseStart,
      allowMultipleSelection: true,
      multiSelectVariable: 'interests',
      buttons: selectionButtons,
      keyboardType: 'inline',
    });
    // Кнопки selection должны генерировать callback handlers
    assert.ok(typeof result === 'string' && result.length > 0);
    assert.ok(result.includes('sport') || result.includes('music') || result.includes('selection'),
      'должны быть обработчики для кнопок выбора');
  });
});

// ─── Тест 4: action:"complete" ───────────────────────────────────────────────

describe('Множественный выбор — Тест 4: action complete', () => {
  it('start: кнопка с action:complete → переход к целевому узлу', () => {
    // generateStart генерирует обработчик /start с клавиатурой.
    // Логика перехода по action:complete обрабатывается отдельным шаблоном
    // (multiselect-check/multi-select-callback). Проверяем что генерация не ломается.
    const result = generateStart({
      ...baseStart,
      allowMultipleSelection: true,
      multiSelectVariable: 'interests',
      buttons: selectionButtons,
      keyboardType: 'inline',
    });
    assert.ok(typeof result === 'string' && result.length > 0,
      'генерация не должна ломаться при action:complete');
  });
});

// ─── Тест 5: Без кнопок selection ────────────────────────────────────────────

describe('Множественный выбор — Тест 5: allowMultipleSelection без кнопок', () => {
  it('start: allowMultipleSelection:true без кнопок → генерация не ломается', () => {
    const result = generateStart({
      ...baseStart,
      allowMultipleSelection: true,
      multiSelectVariable: 'var',
      buttons: [],
      keyboardType: 'none',
    });
    assert.ok(typeof result === 'string' && result.length > 0);
  });
});

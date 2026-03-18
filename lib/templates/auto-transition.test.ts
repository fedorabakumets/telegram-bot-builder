/**
 * @fileoverview Тесты блока "Автопереход"
 * Покрывает: enableAutoTransition, autoTransitionTo
 * для узлов типа start, message
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateStart } from './start/start.renderer';
import { generateMessage } from './message/message.renderer';

// ─── Базовые параметры ────────────────────────────────────────────────────────

const baseStart = {
  nodeId: 'start_1',
  messageText: 'Загрузка...',
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
  messageText: 'Загрузка...',
  keyboardType: 'none' as const,
  buttons: [],
};

// ─── Тест 1: enableAutoTransition ────────────────────────────────────────────

describe('Автопереход — Тест 1: enableAutoTransition', () => {
  it('start: enableAutoTransition:true → FakeCallbackQuery или asyncio.create_task', () => {
    const result = generateStart({
      ...baseStart,
      enableAutoTransition: true,
      autoTransitionTo: 'next_node',
    });
    assert.ok(
      result.includes('FakeCallbackQuery') || result.includes('asyncio') || result.includes('auto_transition') || result.includes('next_node'),
      'должен быть код автоперехода'
    );
  });

  it('start: enableAutoTransition:false → нет автоперехода', () => {
    const result = generateStart({ ...baseStart, enableAutoTransition: false });
    assert.ok(!result.includes('FakeCallbackQuery'), 'не должно быть FakeCallbackQuery');
  });

  it('message: enableAutoTransition:true → автопереход', () => {
    const result = generateMessage({
      ...baseMessage,
      enableAutoTransition: true,
      autoTransitionTo: 'target_node',
    });
    assert.ok(
      result.includes('FakeCallbackQuery') || result.includes('asyncio') || result.includes('target_node'),
      'должен быть код автоперехода'
    );
  });

  it('message: enableAutoTransition:false → нет автоперехода', () => {
    const result = generateMessage({ ...baseMessage, enableAutoTransition: false });
    assert.ok(!result.includes('FakeCallbackQuery'));
  });
});

// ─── Тест 2: autoTransitionTo ────────────────────────────────────────────────

describe('Автопереход — Тест 2: autoTransitionTo', () => {
  it('start: autoTransitionTo задан → ID целевого узла в коде', () => {
    const result = generateStart({
      ...baseStart,
      enableAutoTransition: true,
      autoTransitionTo: 'main_menu_node',
    });
    assert.ok(result.includes('main_menu_node'), 'ID целевого узла должен быть в коде');
  });

  it('message: autoTransitionTo задан → ID целевого узла в коде', () => {
    const result = generateMessage({
      ...baseMessage,
      enableAutoTransition: true,
      autoTransitionTo: 'result_node_456',
    });
    assert.ok(result.includes('result_node_456'), 'ID целевого узла должен быть в коде');
  });
});

// ─── Тест 3: enableAutoTransition без autoTransitionTo ───────────────────────

describe('Автопереход — Тест 3: enableAutoTransition без цели', () => {
  it('start: enableAutoTransition:true, autoTransitionTo:empty → генерация не ломается', () => {
    const result = generateStart({
      ...baseStart,
      enableAutoTransition: true,
      autoTransitionTo: '',
    });
    assert.ok(typeof result === 'string' && result.length > 0);
  });
});

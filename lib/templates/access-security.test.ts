/**
 * @fileoverview Тесты блока "Доступ и безопасность"
 * Покрывает: isPrivateOnly, adminOnly, requiresAuth
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
  messageText: 'Привет!',
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
  messageText: 'Привет!',
  keyboardType: 'none' as const,
  buttons: [],
};

const baseCommand = {
  nodeId: 'cmd_1',
  command: '/help',
  messageText: 'Помощь',
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

// ─── Тест 1: isPrivateOnly ────────────────────────────────────────────────────

describe('Доступ и безопасность — Тест 1: isPrivateOnly', () => {
  it('start: isPrivateOnly:true → проверка приватного чата', () => {
    const result = generateStart({ ...baseStart, isPrivateOnly: true });
    assert.ok(result.includes('is_private_chat') || result.includes('private'), 'должна быть проверка приватного чата');
  });

  it('start: isPrivateOnly:false → нет проверки приватного чата', () => {
    const result = generateStart({ ...baseStart, isPrivateOnly: false });
    assert.ok(!result.includes('is_private_chat'), 'не должно быть проверки приватного чата');
  });

  it('message: isPrivateOnly:true → проверка приватного чата', () => {
    const result = generateMessage({ ...baseMessage, isPrivateOnly: true });
    assert.ok(result.includes('is_private_chat') || result.includes('private'));
  });

  it('command: isPrivateOnly:true → проверка приватного чата', () => {
    const result = generateCommand({ ...baseCommand, isPrivateOnly: true });
    assert.ok(result.includes('is_private_chat') || result.includes('private'));
  });
});

// ─── Тест 2: adminOnly ───────────────────────────────────────────────────────

describe('Доступ и безопасность — Тест 2: adminOnly', () => {
  it('start: adminOnly:true → проверка администратора', () => {
    const result = generateStart({ ...baseStart, adminOnly: true });
    assert.ok(result.includes('is_admin') || result.includes('admin'), 'должна быть проверка администратора');
  });

  it('start: adminOnly:false → нет проверки администратора', () => {
    const result = generateStart({ ...baseStart, adminOnly: false });
    assert.ok(!result.includes('is_admin'), 'не должно быть проверки администратора');
  });

  it('message: adminOnly:true → проверка администратора', () => {
    const result = generateMessage({ ...baseMessage, adminOnly: true });
    assert.ok(result.includes('is_admin') || result.includes('admin'));
  });

  it('command: adminOnly:true → проверка администратора', () => {
    const result = generateCommand({ ...baseCommand, adminOnly: true });
    assert.ok(result.includes('is_admin') || result.includes('admin'));
  });
});

// ─── Тест 3: requiresAuth ────────────────────────────────────────────────────

describe('Доступ и безопасность — Тест 3: requiresAuth', () => {
  it('start: requiresAuth:true → проверка авторизации', () => {
    const result = generateStart({ ...baseStart, requiresAuth: true, userDatabaseEnabled: true });
    assert.ok(result.includes('check_auth') || result.includes('auth'), 'должна быть проверка авторизации');
  });

  it('start: requiresAuth:false → нет проверки авторизации', () => {
    const result = generateStart({ ...baseStart, requiresAuth: false });
    assert.ok(!result.includes('check_auth'), 'не должно быть проверки авторизации');
  });

  it('message: requiresAuth:true → проверка авторизации', () => {
    const result = generateMessage({ ...baseMessage, requiresAuth: true, userDatabaseEnabled: true });
    assert.ok(result.includes('check_auth') || result.includes('auth'));
  });

  it('command: requiresAuth:true → проверка авторизации', () => {
    const result = generateCommand({ ...baseCommand, requiresAuth: true, userDatabaseEnabled: true });
    assert.ok(result.includes('check_auth') || result.includes('auth'));
  });
});

// ─── Тест 4: Комбинация всех флагов ─────────────────────────────────────────

describe('Доступ и безопасность — Тест 4: все флаги вместе', () => {
  it('start: isPrivateOnly + adminOnly + requiresAuth → все три проверки', () => {
    const result = generateStart({
      ...baseStart,
      isPrivateOnly: true,
      adminOnly: true,
      requiresAuth: true,
      userDatabaseEnabled: true,
    });
    assert.ok(result.includes('is_private_chat') || result.includes('private'), 'проверка приватного чата');
    assert.ok(result.includes('is_admin') || result.includes('admin'), 'проверка администратора');
    assert.ok(result.includes('check_auth') || result.includes('auth'), 'проверка авторизации');
  });

  it('message: все флаги false → нет проверок', () => {
    const result = generateMessage({
      ...baseMessage,
      isPrivateOnly: false,
      adminOnly: false,
      requiresAuth: false,
    });
    assert.ok(!result.includes('is_private_chat'));
    assert.ok(!result.includes('is_admin'));
    assert.ok(!result.includes('check_auth'));
  });
});

/**
 * @fileoverview Тесты для шаблона обработчиков командных триггеров
 * @module templates/command-trigger/command-trigger.test
 */

import { describe, it, expect } from 'vitest';
import {
  generateCommandTriggers,
  generateCommandTriggerHandlers,
  collectCommandTriggerEntries,
} from './command-trigger.renderer';
import {
  validParamsEmpty,
  validParamsSingle,
  validParamsPrivateOnly,
  validParamsMultiple,
  invalidParamsMissingCommand,
  nodesWithCommandTrigger,
  nodesWithMultipleCommandTriggers,
  nodesWithMissingTarget,
  nodesWithEmptyCommand,
  nodesWithoutCommandTriggers,
  nodesWithNullAndMixed,
  validParamsAdminOnly,
  validParamsRequiresAuth,
  nodesWithAdminOnly,
  nodesWithRequiresAuth,
} from './command-trigger.fixture';
import { commandTriggerParamsSchema } from './command-trigger.schema';

// ─── generateCommandTriggers() ───────────────────────────────────────────────

describe('generateCommandTriggers()', () => {
  it('пустой массив → пустая строка', () => {
    expect(generateCommandTriggers(validParamsEmpty)).toBe('');
  });

  it('генерирует @dp.message(Command(...))', () => {
    const r = generateCommandTriggers(validParamsSingle);
    expect(r).toContain('@dp.message(Command("start"))');
  });

  it('убирает слэш из команды', () => {
    const r = generateCommandTriggers(validParamsSingle);
    expect(r).toContain('Command("start")');
    expect(r).not.toContain('Command("/start")');
  });

  it('isPrivateOnly добавляет проверку типа чата', () => {
    const r = generateCommandTriggers(validParamsPrivateOnly);
    expect(r).toContain("message.chat.type != 'private'");
    expect(r).toContain('Эта команда доступна только в приватных чатах');
  });

  it('без isPrivateOnly нет проверки типа чата', () => {
    const r = generateCommandTriggers(validParamsSingle);
    expect(r).not.toContain("message.chat.type != 'private'");
  });

  it('adminOnly добавляет проверку прав администратора', () => {
    const r = generateCommandTriggers(validParamsAdminOnly);
    expect(r).toContain('is_admin(user_id)');
    expect(r).toContain('У вас нет прав для выполнения этой команды');
  });

  it('requiresAuth добавляет проверку авторизации', () => {
    const r = generateCommandTriggers(validParamsRequiresAuth);
    expect(r).toContain('check_auth(user_id)');
    expect(r).toContain('войти в систему');

  it('без adminOnly нет проверки прав', () => {
    const r = generateCommandTriggers(validParamsSingle);
    expect(r).not.toContain('is_admin(');
  });

  it('без requiresAuth нет проверки авторизации', () => {
    const r = generateCommandTriggers(validParamsSingle);
    expect(r).not.toContain('check_auth(');
  });

  it('генерирует MockCallback и вызов handle_callback', () => {
    const r = generateCommandTriggers(validParamsSingle);
    expect(r).toContain('class MockCallback:');
    expect(r).toContain('mock_callback = MockCallback');
    expect(r).toContain('await handle_callback_msg_welcome(mock_callback)');
  });

  it('имя функции содержит nodeId', () => {
    const r = generateCommandTriggers(validParamsSingle);
    expect(r).toContain('command_trigger_trigger_start_handler');
  });

  it('содержит logging.info с user_id', () => {
    const r = generateCommandTriggers(validParamsSingle);
    expect(r).toContain('logging.info');
    expect(r).toContain('user_id');
  });

  it('несколько триггеров → несколько обработчиков', () => {
    const r = generateCommandTriggers(validParamsMultiple);
    const count = (r.match(/@dp\.message\(Command/g) || []).length;
    expect(count).toBe(3);
  });

  it('синтаксически корректный Python — нет незакрытых скобок', () => {
    const r = generateCommandTriggers(validParamsSingle);
    const opens = (r.match(/\(/g) || []).length;
    const closes = (r.match(/\)/g) || []).length;
    expect(opens).toBe(closes);
  });
});

// ─── commandTriggerParamsSchema ──────────────────────────────────────────────

describe('commandTriggerParamsSchema', () => {
  it('принимает валидные параметры с одним триггером', () => {
    expect(commandTriggerParamsSchema.safeParse(validParamsSingle).success).toBe(true);
  });

  it('принимает пустой массив', () => {
    expect(commandTriggerParamsSchema.safeParse(validParamsEmpty).success).toBe(true);
  });

  it('принимает несколько триггеров', () => {
    expect(commandTriggerParamsSchema.safeParse(validParamsMultiple).success).toBe(true);
  });

  it('принимает триггер с isPrivateOnly', () => {
    expect(commandTriggerParamsSchema.safeParse(validParamsPrivateOnly).success).toBe(true);
  });

  it('отклоняет пустую команду', () => {
    expect(commandTriggerParamsSchema.safeParse(invalidParamsMissingCommand).success).toBe(false);
  });
});

// ─── collectCommandTriggerEntries() ──────────────────────────────────────────

describe('collectCommandTriggerEntries()', () => {
  it('собирает триггер с правильными полями', () => {
    const entries = collectCommandTriggerEntries(nodesWithCommandTrigger);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('trigger_start');
    expect(entries[0].command).toBe('/start');
    expect(entries[0].targetNodeId).toBe('msg_welcome');
    expect(entries[0].targetNodeType).toBe('message');
  });

  it('собирает несколько триггеров', () => {
    const entries = collectCommandTriggerEntries(nodesWithMultipleCommandTriggers);
    expect(entries).toHaveLength(2);
    expect(entries.map(e => e.command)).toEqual(['/start', '/help']);
  });

  it('пропускает триггер без autoTransitionTo', () => {
    expect(collectCommandTriggerEntries(nodesWithMissingTarget)).toHaveLength(0);
  });

  it('пропускает триггер с пустой командой', () => {
    expect(collectCommandTriggerEntries(nodesWithEmptyCommand)).toHaveLength(0);
  });

  it('пропускает узлы не типа command_trigger', () => {
    expect(collectCommandTriggerEntries(nodesWithoutCommandTriggers)).toHaveLength(0);
  });

  it('фильтрует null узлы', () => {
    const entries = collectCommandTriggerEntries(nodesWithNullAndMixed);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('trigger_start');
  });

  it('возвращает пустой массив для пустого входа', () => {
    expect(collectCommandTriggerEntries([])).toEqual([]);
  });

  it('передаёт adminOnly из узла', () => {
    const entries = collectCommandTriggerEntries(nodesWithAdminOnly);
    expect(entries[0].adminOnly).toBe(true);
  });

  it('передаёт requiresAuth из узла', () => {
    const entries = collectCommandTriggerEntries(nodesWithRequiresAuth);
    expect(entries[0].requiresAuth).toBe(true);
  });
});

// ─── generateCommandTriggerHandlers() ────────────────────────────────────────

describe('generateCommandTriggerHandlers()', () => {
  it('пустые узлы → пустая строка', () => {
    expect(generateCommandTriggerHandlers([])).toBe('');
  });

  it('генерирует код из узлов напрямую', () => {
    const r = generateCommandTriggerHandlers(nodesWithCommandTrigger);
    expect(r).toContain('Command("start")');
    expect(r).toContain('handle_callback_msg_welcome');
  });

  it('несколько триггеров из узлов', () => {
    const r = generateCommandTriggerHandlers(nodesWithMultipleCommandTriggers);
    expect(r).toContain('Command("start")');
    expect(r).toContain('Command("help")');
  });

  it('фильтрует null узлы и не-триггеры', () => {
    const r = generateCommandTriggerHandlers(nodesWithNullAndMixed);
    expect(r).toContain('Command("start")');
  });

  it('узлы без command_trigger → пустая строка', () => {
    expect(generateCommandTriggerHandlers(nodesWithoutCommandTriggers)).toBe('');
  });
});

// ─── Производительность ──────────────────────────────────────────────────────

describe('Производительность', () => {
  it('generateCommandTriggers: быстрее 100ms', () => {
    const start = Date.now();
    generateCommandTriggers(validParamsMultiple);
    expect(Date.now() - start).toBeLessThan(100);
  });

  it('generateCommandTriggerHandlers: быстрее 100ms', () => {
    const start = Date.now();
    generateCommandTriggerHandlers(nodesWithMultipleCommandTriggers);
    expect(Date.now() - start).toBeLessThan(100);
  });
});

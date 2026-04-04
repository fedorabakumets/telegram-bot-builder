/**
 * @fileoverview Тесты для шаблона обработчиков триггеров inline-кнопок
 * @module templates/callback-trigger/callback-trigger.test
 */

import { describe, it, expect } from 'vitest';
import {
  generateCallbackTriggers,
  generateCallbackTriggerHandlers,
  collectCallbackTriggerEntries,
} from './callback-trigger.renderer';
import {
  validParamsEmpty,
  validParamsExact,
  validParamsStartswith,
  validParamsAdminOnly,
  validParamsRequiresAuth,
  validParamsMultiple,
  invalidParamsMissingCallbackData,
  nodesWithCallbackTriggerExact,
  nodesWithCallbackTriggerStartswith,
  nodesWithMissingTarget,
  nodesWithEmptyCallbackData,
  nodesWithoutCallbackTriggers,
  nodesWithNullAndMixed,
  nodesWithAdminOnly,
  nodesWithRequiresAuth,
} from './callback-trigger.fixture';
import { callbackTriggerParamsSchema } from './callback-trigger.schema';

// ─── generateCallbackTriggers() ──────────────────────────────────────────────

describe('generateCallbackTriggers()', () => {
  it('пустой массив → пустая строка', () => {
    expect(generateCallbackTriggers(validParamsEmpty)).toBe('');
  });

  it('exact генерирует lambda c: c.data == "..."', () => {
    const r = generateCallbackTriggers(validParamsExact);
    expect(r).toContain('lambda c: c.data == "confirm_order"');
  });

  it('startswith генерирует lambda c: c.data and c.data.startswith("...")', () => {
    const r = generateCallbackTriggers(validParamsStartswith);
    expect(r).toContain('lambda c: c.data and c.data.startswith("order_")');
  });

  it('генерирует @dp.callback_query декоратор', () => {
    const r = generateCallbackTriggers(validParamsExact);
    expect(r).toContain('@dp.callback_query(');
  });

  it('имя функции содержит nodeId', () => {
    const r = generateCallbackTriggers(validParamsExact);
    expect(r).toContain('callback_trigger_trigger_confirm_handler');
  });

  it('генерирует class MockCallback', () => {
    const r = generateCallbackTriggers(validParamsExact);
    expect(r).toContain('class MockCallback:');
  });

  it('генерирует mock_callback = MockCallback и вызов handle_callback', () => {
    const r = generateCallbackTriggers(validParamsExact);
    expect(r).toContain('mock_callback = MockCallback(');
    expect(r).toContain('await handle_callback_msg_confirmed(mock_callback)');
  });

  it('содержит logging.info с user_id', () => {
    const r = generateCallbackTriggers(validParamsExact);
    expect(r).toContain('logging.info');
    expect(r).toContain('user_id');
  });

  it('adminOnly добавляет проверку is_admin', () => {
    const r = generateCallbackTriggers(validParamsAdminOnly);
    expect(r).toContain('is_admin(user_id)');
    expect(r).toContain('У вас нет прав для выполнения этого действия');
  });

  it('requiresAuth добавляет проверку check_auth', () => {
    const r = generateCallbackTriggers(validParamsRequiresAuth);
    expect(r).toContain('check_auth(user_id)');
    expect(r).toContain('/start');
  });

  it('без adminOnly нет проверки прав', () => {
    const r = generateCallbackTriggers(validParamsExact);
    expect(r).not.toContain('is_admin(');
  });

  it('без requiresAuth нет проверки авторизации', () => {
    const r = generateCallbackTriggers(validParamsExact);
    expect(r).not.toContain('check_auth(');
  });

  it('несколько триггеров → несколько обработчиков', () => {
    const r = generateCallbackTriggers(validParamsMultiple);
    const count = (r.match(/@dp\.callback_query\(/g) || []).length;
    expect(count).toBe(3);
  });

  it('синтаксически корректный Python — нет незакрытых скобок', () => {
    const r = generateCallbackTriggers(validParamsExact);
    const opens = (r.match(/\(/g) || []).length;
    const closes = (r.match(/\)/g) || []).length;
    expect(opens).toBe(closes);
  });
});

// ─── callbackTriggerParamsSchema ─────────────────────────────────────────────

describe('callbackTriggerParamsSchema', () => {
  it('принимает валидные параметры exact', () => {
    expect(callbackTriggerParamsSchema.safeParse(validParamsExact).success).toBe(true);
  });

  it('принимает валидные параметры startswith', () => {
    expect(callbackTriggerParamsSchema.safeParse(validParamsStartswith).success).toBe(true);
  });

  it('принимает пустой массив', () => {
    expect(callbackTriggerParamsSchema.safeParse(validParamsEmpty).success).toBe(true);
  });

  it('принимает несколько триггеров', () => {
    expect(callbackTriggerParamsSchema.safeParse(validParamsMultiple).success).toBe(true);
  });

  it('отклоняет пустой callbackData', () => {
    expect(callbackTriggerParamsSchema.safeParse(invalidParamsMissingCallbackData).success).toBe(false);
  });

  it('отклоняет неверный matchType', () => {
    const bad = { entries: [{ nodeId: 'n1', callbackData: 'data', matchType: 'contains', targetNodeId: 't1', targetNodeType: 'message' }] };
    expect(callbackTriggerParamsSchema.safeParse(bad).success).toBe(false);
  });
});

// ─── collectCallbackTriggerEntries() ─────────────────────────────────────────

describe('collectCallbackTriggerEntries()', () => {
  it('собирает триггер с правильными полями (exact)', () => {
    const entries = collectCallbackTriggerEntries(nodesWithCallbackTriggerExact);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('trigger_confirm');
    expect(entries[0].callbackData).toBe('confirm_order');
    expect(entries[0].matchType).toBe('exact');
    expect(entries[0].targetNodeId).toBe('msg_confirmed');
  });

  it('собирает триггер с matchType startswith', () => {
    const entries = collectCallbackTriggerEntries(nodesWithCallbackTriggerStartswith);
    expect(entries).toHaveLength(1);
    expect(entries[0].matchType).toBe('startswith');
  });

  it('пропускает триггер без autoTransitionTo', () => {
    expect(collectCallbackTriggerEntries(nodesWithMissingTarget)).toHaveLength(0);
  });

  it('пропускает триггер с пустым callbackData', () => {
    expect(collectCallbackTriggerEntries(nodesWithEmptyCallbackData)).toHaveLength(0);
  });

  it('пропускает узлы не типа callback_trigger', () => {
    expect(collectCallbackTriggerEntries(nodesWithoutCallbackTriggers)).toHaveLength(0);
  });

  it('фильтрует null узлы', () => {
    const entries = collectCallbackTriggerEntries(nodesWithNullAndMixed);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('trigger_confirm');
  });

  it('возвращает пустой массив для пустого входа', () => {
    expect(collectCallbackTriggerEntries([])).toEqual([]);
  });

  it('передаёт adminOnly из узла', () => {
    const entries = collectCallbackTriggerEntries(nodesWithAdminOnly);
    expect(entries[0].adminOnly).toBe(true);
  });

  it('передаёт requiresAuth из узла', () => {
    const entries = collectCallbackTriggerEntries(nodesWithRequiresAuth);
    expect(entries[0].requiresAuth).toBe(true);
  });
});

// ─── generateCallbackTriggerHandlers() ───────────────────────────────────────

describe('generateCallbackTriggerHandlers()', () => {
  it('пустые узлы → пустая строка', () => {
    expect(generateCallbackTriggerHandlers([])).toBe('');
  });

  it('генерирует exact из узлов напрямую', () => {
    const r = generateCallbackTriggerHandlers(nodesWithCallbackTriggerExact);
    expect(r).toContain('lambda c: c.data == "confirm_order"');
    expect(r).toContain('handle_callback_msg_confirmed');
  });

  it('генерирует startswith из узлов напрямую', () => {
    const r = generateCallbackTriggerHandlers(nodesWithCallbackTriggerStartswith);
    expect(r).toContain('c.data.startswith("order_")');
  });

  it('фильтрует null узлы и не-триггеры', () => {
    const r = generateCallbackTriggerHandlers(nodesWithNullAndMixed);
    expect(r).toContain('lambda c: c.data == "confirm"');
  });

  it('узлы без callback_trigger → пустая строка', () => {
    expect(generateCallbackTriggerHandlers(nodesWithoutCallbackTriggers)).toBe('');
  });
});

// ─── Производительность ──────────────────────────────────────────────────────

describe('Производительность', () => {
  it('generateCallbackTriggers: быстрее 100ms', () => {
    const start = Date.now();
    generateCallbackTriggers(validParamsMultiple);
    expect(Date.now() - start).toBeLessThan(100);
  });

  it('generateCallbackTriggerHandlers: быстрее 100ms', () => {
    const start = Date.now();
    generateCallbackTriggerHandlers(nodesWithCallbackTriggerExact);
    expect(Date.now() - start).toBeLessThan(100);
  });
});

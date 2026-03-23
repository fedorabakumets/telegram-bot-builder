/**
 * @fileoverview Тесты для шаблона обработчиков текстовых триггеров
 * @module templates/text-trigger/text-trigger.test
 */

import { describe, it, expect } from 'vitest';
import {
  generateTextTriggers,
  generateTextTriggerHandlers,
  collectTextTriggerEntries,
} from './text-trigger.renderer';
import {
  validParamsEmpty,
  validParamsExact,
  validParamsContains,
  validParamsMultipleSynonyms,
  validParamsMixed,
  invalidParamsWrongMatchType,
  nodesWithExactTrigger,
  nodesWithContainsTrigger,
  nodesWithMultipleSynonyms,
  nodesWithMissingTarget,
  nodesWithEmptySynonyms,
  nodesWithoutTriggers,
  nodesWithNullAndMixed,
  validParamsAdminOnly,
  validParamsRequiresAuth,
  nodesWithAdminOnly,
  nodesWithRequiresAuth,
} from './text-trigger.fixture';
import { textTriggerParamsSchema } from './text-trigger.schema';

// ─── generateTextTriggers() ──────────────────────────────────────────────────

describe('generateTextTriggers()', () => {
  it('пустой массив → пустая строка', () => {
    expect(generateTextTriggers(validParamsEmpty)).toBe('');
  });

  it('exact match генерирует ==', () => {
    const r = generateTextTriggers(validParamsExact);
    expect(r).toContain('message.text.lower() == "привет"');
    expect(r).not.toContain('"привет" in message.text.lower()');
  });

  it('contains match генерирует in', () => {
    const r = generateTextTriggers(validParamsContains);
    expect(r).toContain('"помощь" in message.text.lower()');
    expect(r).not.toContain('message.text.lower() == "помощь"');
  });

  it('несколько синонимов → несколько обработчиков', () => {
    const r = generateTextTriggers(validParamsMultipleSynonyms);
    expect(r).toContain('"привет"');
    expect(r).toContain('"здравствуй"');
    expect(r).toContain('"hello"');
    const count = (r.match(/@dp\.message/g) || []).length;
    expect(count).toBe(3);
  });

  it('генерирует MockCallback и вызов handle_callback', () => {
    const r = generateTextTriggers(validParamsExact);
    expect(r).toContain('class MockCallback:');
    expect(r).toContain('mock_callback = MockCallback');
    expect(r).toContain('await handle_callback_msg_hello(mock_callback)');
  });

  it('adminOnly добавляет проверку прав администратора', () => {
    const r = generateTextTriggers(validParamsAdminOnly);
    expect(r).toContain('is_admin(user_id)');
    expect(r).toContain('У вас нет прав для выполнения этой команды');
  });

  it('requiresAuth добавляет проверку авторизации', () => {
    const r = generateTextTriggers(validParamsRequiresAuth);
    expect(r).toContain('check_auth(user_id)');
    expect(r).toContain('/start');
  });

  it('без adminOnly нет проверки прав', () => {
    const r = generateTextTriggers(validParamsExact);
    expect(r).not.toContain('is_admin(');
  });

  it('без requiresAuth нет проверки авторизации', () => {
    const r = generateTextTriggers(validParamsExact);
    expect(r).not.toContain('check_auth(');
  });

  it('смешанные exact и contains генерируются вместе', () => {
    const r = generateTextTriggers(validParamsMixed);
    expect(r).toContain('message.text.lower() == "старт"');
    expect(r).toContain('"помоги" in message.text.lower()');
  });

  it('имя функции содержит nodeId', () => {
    const r = generateTextTriggers(validParamsExact);
    expect(r).toContain('text_trigger_trigger_1_');
  });

  it('содержит logging.info с user_id', () => {
    const r = generateTextTriggers(validParamsExact);
    expect(r).toContain('logging.info');
    expect(r).toContain('user_id');
  });

  it('синтаксически корректный Python — нет незакрытых скобок', () => {
    const r = generateTextTriggers(validParamsExact);
    const opens = (r.match(/\(/g) || []).length;
    const closes = (r.match(/\)/g) || []).length;
    expect(opens).toBe(closes);
  });
});

// ─── textTriggerParamsSchema ─────────────────────────────────────────────────

describe('textTriggerParamsSchema', () => {
  it('принимает валидные exact параметры', () => {
    expect(textTriggerParamsSchema.safeParse(validParamsExact).success).toBe(true);
  });

  it('принимает валидные contains параметры', () => {
    expect(textTriggerParamsSchema.safeParse(validParamsContains).success).toBe(true);
  });

  it('принимает пустой массив', () => {
    expect(textTriggerParamsSchema.safeParse(validParamsEmpty).success).toBe(true);
  });

  it('отклоняет неверный matchType', () => {
    expect(textTriggerParamsSchema.safeParse(invalidParamsWrongMatchType).success).toBe(false);
  });
});

// ─── collectTextTriggerEntries() ─────────────────────────────────────────────

describe('collectTextTriggerEntries()', () => {
  it('собирает exact триггер с правильными полями', () => {
    const entries = collectTextTriggerEntries(nodesWithExactTrigger);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('trigger_1');
    expect(entries[0].matchType).toBe('exact');
    expect(entries[0].targetNodeId).toBe('msg_hello');
    expect(entries[0].targetNodeType).toBe('message');
    expect(entries[0].synonyms).toEqual(['привет']);
  });

  it('собирает contains триггер', () => {
    const entries = collectTextTriggerEntries(nodesWithContainsTrigger);
    expect(entries).toHaveLength(1);
    expect(entries[0].matchType).toBe('contains');
  });

  it('собирает несколько синонимов', () => {
    const entries = collectTextTriggerEntries(nodesWithMultipleSynonyms);
    expect(entries).toHaveLength(1);
    expect(entries[0].synonyms).toEqual(['привет', 'здравствуй', 'hello']);
  });

  it('пропускает триггер без autoTransitionTo', () => {
    expect(collectTextTriggerEntries(nodesWithMissingTarget)).toHaveLength(0);
  });

  it('пропускает триггер с пустым textSynonyms', () => {
    expect(collectTextTriggerEntries(nodesWithEmptySynonyms)).toHaveLength(0);
  });

  it('пропускает узлы не типа text_trigger', () => {
    expect(collectTextTriggerEntries(nodesWithoutTriggers)).toHaveLength(0);
  });

  it('фильтрует null узлы', () => {
    const entries = collectTextTriggerEntries(nodesWithNullAndMixed);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('trigger_1');
  });

  it('возвращает пустой массив для пустого входа', () => {
    expect(collectTextTriggerEntries([])).toEqual([]);
  });

  it('передаёт adminOnly из узла', () => {
    const entries = collectTextTriggerEntries(nodesWithAdminOnly);
    expect(entries[0].adminOnly).toBe(true);
  });

  it('передаёт requiresAuth из узла', () => {
    const entries = collectTextTriggerEntries(nodesWithRequiresAuth);
    expect(entries[0].requiresAuth).toBe(true);
  });
});

// ─── generateTextTriggerHandlers() ───────────────────────────────────────────

describe('generateTextTriggerHandlers()', () => {
  it('пустые узлы → пустая строка', () => {
    expect(generateTextTriggerHandlers([])).toBe('');
  });

  it('генерирует код из узлов напрямую (exact)', () => {
    const r = generateTextTriggerHandlers(nodesWithExactTrigger);
    expect(r).toContain('message.text.lower() == "привет"');
    expect(r).toContain('handle_callback_msg_hello');
  });

  it('генерирует код из узлов напрямую (contains)', () => {
    const r = generateTextTriggerHandlers(nodesWithContainsTrigger);
    expect(r).toContain('"помощь" in message.text.lower()');
  });

  it('несколько синонимов из узлов', () => {
    const r = generateTextTriggerHandlers(nodesWithMultipleSynonyms);
    expect(r).toContain('"привет"');
    expect(r).toContain('"здравствуй"');
    expect(r).toContain('"hello"');
  });

  it('фильтрует null узлы и не-триггеры', () => {
    const r = generateTextTriggerHandlers(nodesWithNullAndMixed);
    expect(r).toContain('"привет"');
  });
});

// ─── Производительность ──────────────────────────────────────────────────────

describe('Производительность', () => {
  it('generateTextTriggers: быстрее 100ms', () => {
    const start = Date.now();
    generateTextTriggers(validParamsMixed);
    expect(Date.now() - start).toBeLessThan(100);
  });

  it('generateTextTriggerHandlers: быстрее 100ms', () => {
    const start = Date.now();
    generateTextTriggerHandlers(nodesWithMultipleSynonyms);
    expect(Date.now() - start).toBeLessThan(100);
  });
});

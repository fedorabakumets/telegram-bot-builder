/**
 * @fileoverview Тесты для шаблона обработчиков текстовых триггеров
 * @module templates/text-trigger/text-trigger.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
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
  validParamsPrivateOnly,
  invalidParamsWrongMatchType,
  nodesWithExactTrigger,
  nodesWithContainsTrigger,
  nodesWithMultipleSynonyms,
  nodesWithMissingTarget,
  nodesWithEmptySynonyms,
  nodesWithoutTriggers,
  nodesWithNullAndMixed,
} from './text-trigger.fixture';
import { textTriggerParamsSchema } from './text-trigger.schema';

// ─── generateTextTriggers() ──────────────────────────────────────────────────

describe('generateTextTriggers()', () => {
  it('пустой массив → пустая строка', () => {
    assert.strictEqual(generateTextTriggers(validParamsEmpty), '');
  });

  it('exact match генерирует ==', () => {
    const r = generateTextTriggers(validParamsExact);
    assert.ok(r.includes('message.text.lower() == "привет"'), 'должен содержать == "привет"');
    assert.ok(!r.includes('"привет" in message.text.lower()'), 'не должен содержать in для exact');
  });

  it('contains match генерирует in', () => {
    const r = generateTextTriggers(validParamsContains);
    assert.ok(r.includes('"помощь" in message.text.lower()'), 'должен содержать in "помощь"');
    assert.ok(!r.includes('message.text.lower() == "помощь"'), 'не должен содержать == для contains');
  });

  it('несколько синонимов → несколько обработчиков', () => {
    const r = generateTextTriggers(validParamsMultipleSynonyms);
    assert.ok(r.includes('"привет"'));
    assert.ok(r.includes('"здравствуй"'));
    assert.ok(r.includes('"hello"'));
    // Три отдельных декоратора @dp.message
    const count = (r.match(/@dp\.message/g) || []).length;
    assert.strictEqual(count, 3, `ожидалось 3 обработчика, получено ${count}`);
  });

  it('генерирует MockCallback и вызов handle_callback', () => {
    const r = generateTextTriggers(validParamsExact);
    assert.ok(r.includes('class MockCallback:'));
    assert.ok(r.includes('mock_callback = MockCallback'));
    assert.ok(r.includes('await handle_callback_msg_hello(mock_callback)'));
  });

  it('isPrivateOnly добавляет проверку типа чата', () => {
    const r = generateTextTriggers(validParamsPrivateOnly);
    assert.ok(r.includes("message.chat.type != 'private'"));
    assert.ok(r.includes('Эта команда доступна только в приватных чатах'));
  });

  it('без isPrivateOnly нет проверки типа чата', () => {
    const r = generateTextTriggers(validParamsExact);
    assert.ok(!r.includes("message.chat.type != 'private'"));
  });

  it('смешанные exact и contains генерируются вместе', () => {
    const r = generateTextTriggers(validParamsMixed);
    assert.ok(r.includes('message.text.lower() == "старт"'));
    assert.ok(r.includes('"помоги" in message.text.lower()'));
  });

  it('имя функции содержит nodeId', () => {
    const r = generateTextTriggers(validParamsExact);
    assert.ok(r.includes('text_trigger_trigger_1_'));
  });

  it('содержит logging.info с user_id', () => {
    const r = generateTextTriggers(validParamsExact);
    assert.ok(r.includes('logging.info'));
    assert.ok(r.includes('user_id'));
  });

  it('синтаксически корректный Python — нет незакрытых скобок', () => {
    const r = generateTextTriggers(validParamsExact);
    const opens = (r.match(/\(/g) || []).length;
    const closes = (r.match(/\)/g) || []).length;
    assert.strictEqual(opens, closes, `Несбалансированные скобки: ${opens} открытых, ${closes} закрытых`);
  });
});

// ─── textTriggerParamsSchema ─────────────────────────────────────────────────

describe('textTriggerParamsSchema', () => {
  it('принимает валидные exact параметры', () => {
    assert.ok(textTriggerParamsSchema.safeParse(validParamsExact).success);
  });

  it('принимает валидные contains параметры', () => {
    assert.ok(textTriggerParamsSchema.safeParse(validParamsContains).success);
  });

  it('принимает пустой массив', () => {
    assert.ok(textTriggerParamsSchema.safeParse(validParamsEmpty).success);
  });

  it('отклоняет неверный matchType', () => {
    assert.ok(!textTriggerParamsSchema.safeParse(invalidParamsWrongMatchType).success);
  });
});

// ─── collectTextTriggerEntries() ─────────────────────────────────────────────

describe('collectTextTriggerEntries()', () => {
  it('собирает exact триггер с правильными полями', () => {
    const entries = collectTextTriggerEntries(nodesWithExactTrigger);
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0].nodeId, 'trigger_1');
    assert.strictEqual(entries[0].matchType, 'exact');
    assert.strictEqual(entries[0].targetNodeId, 'msg_hello');
    assert.strictEqual(entries[0].targetNodeType, 'message');
    assert.deepStrictEqual(entries[0].synonyms, ['привет']);
  });

  it('собирает contains триггер', () => {
    const entries = collectTextTriggerEntries(nodesWithContainsTrigger);
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0].matchType, 'contains');
  });

  it('собирает несколько синонимов', () => {
    const entries = collectTextTriggerEntries(nodesWithMultipleSynonyms);
    assert.strictEqual(entries.length, 1);
    assert.deepStrictEqual(entries[0].synonyms, ['привет', 'здравствуй', 'hello']);
  });

  it('пропускает триггер без autoTransitionTo', () => {
    const entries = collectTextTriggerEntries(nodesWithMissingTarget);
    assert.strictEqual(entries.length, 0);
  });

  it('пропускает триггер с пустым textSynonyms', () => {
    const entries = collectTextTriggerEntries(nodesWithEmptySynonyms);
    assert.strictEqual(entries.length, 0);
  });

  it('пропускает узлы не типа text_trigger', () => {
    const entries = collectTextTriggerEntries(nodesWithoutTriggers);
    assert.strictEqual(entries.length, 0);
  });

  it('фильтрует null узлы', () => {
    const entries = collectTextTriggerEntries(nodesWithNullAndMixed);
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0].nodeId, 'trigger_1');
  });

  it('возвращает пустой массив для пустого входа', () => {
    assert.deepStrictEqual(collectTextTriggerEntries([]), []);
  });
});

// ─── generateTextTriggerHandlers() ───────────────────────────────────────────

describe('generateTextTriggerHandlers()', () => {
  it('пустые узлы → пустая строка', () => {
    assert.strictEqual(generateTextTriggerHandlers([]), '');
  });

  it('генерирует код из узлов напрямую (exact)', () => {
    const r = generateTextTriggerHandlers(nodesWithExactTrigger);
    assert.ok(r.includes('message.text.lower() == "привет"'));
    assert.ok(r.includes('handle_callback_msg_hello'));
  });

  it('генерирует код из узлов напрямую (contains)', () => {
    const r = generateTextTriggerHandlers(nodesWithContainsTrigger);
    assert.ok(r.includes('"помощь" in message.text.lower()'));
  });

  it('несколько синонимов из узлов', () => {
    const r = generateTextTriggerHandlers(nodesWithMultipleSynonyms);
    assert.ok(r.includes('"привет"'));
    assert.ok(r.includes('"здравствуй"'));
    assert.ok(r.includes('"hello"'));
  });

  it('фильтрует null узлы и не-триггеры', () => {
    const r = generateTextTriggerHandlers(nodesWithNullAndMixed);
    assert.ok(r.includes('"привет"'));
  });
});

// ─── Производительность ──────────────────────────────────────────────────────

describe('Производительность', () => {
  it('generateTextTriggers: быстрее 10ms', () => {
    const start = Date.now();
    generateTextTriggers(validParamsMixed);
    assert.ok(Date.now() - start < 10);
  });

  it('generateTextTriggerHandlers: быстрее 10ms', () => {
    const start = Date.now();
    generateTextTriggerHandlers(nodesWithMultipleSynonyms);
    assert.ok(Date.now() - start < 10);
  });
});

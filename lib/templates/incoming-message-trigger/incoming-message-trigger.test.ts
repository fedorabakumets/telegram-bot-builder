/**
 * @fileoverview Тесты для шаблона middleware триггера входящего сообщения
 * @module templates/incoming-message-trigger/incoming-message-trigger.test
 */

import { describe, it, expect } from 'vitest';
import {
  generateIncomingMessageTriggers,
  generateIncomingMessageTriggerHandlers,
  collectIncomingMessageTriggerEntries,
} from './incoming-message-trigger.renderer';
import {
  validParamsEmpty,
  validParamsSingle,
  validParamsMultiple,
  validParamsGroupFilter,
  nodesWithTrigger,
  nodesWithMissingTarget,
  nodesWithoutTriggers,
  nodesWithNullAndMixed,
} from './incoming-message-trigger.fixture';
import { incomingMessageTriggerParamsSchema } from './incoming-message-trigger.schema';

// ─── generateIncomingMessageTriggers() ───────────────────────────────────────

describe('generateIncomingMessageTriggers()', () => {
  it('пустой массив → пустая строка', () => {
    expect(generateIncomingMessageTriggers(validParamsEmpty)).toBe('');
  });

  it('генерирует async def middleware функцию', () => {
    const r = generateIncomingMessageTriggers(validParamsSingle);
    expect(r).toContain('async def incoming_message_trigger_trigger_1_middleware');
  });

  it('регистрирует async def middleware функцию', () => {
    const r = generateIncomingMessageTriggers(validParamsSingle);
    expect(r).toContain('async def incoming_message_trigger_trigger_1_middleware');
  });

  it('содержит result = await handler(event, data) и return result', () => {
    const r = generateIncomingMessageTriggers(validParamsSingle);
    expect(r).toContain('result = await handler(event, data)');
    expect(r).toContain('return result');
  });

  it('генерирует MockCallback', () => {
    const r = generateIncomingMessageTriggers(validParamsSingle);
    expect(r).toContain('class MockCallback:');
    expect(r).toContain('mock_callback = MockCallback');
  });

  it('вызывает handle_callback с правильным targetNodeId', () => {
    const r = generateIncomingMessageTriggers(validParamsSingle);
    expect(r).toContain('await handle_callback_msg_hello(mock_callback, state=_state)');
  });

  it('содержит logging.info с user_id', () => {
    const r = generateIncomingMessageTriggers(validParamsSingle);
    expect(r).toContain('logging.info');
    expect(r).toContain('user_id');
  });

  it('содержит logging.error для обработки исключений', () => {
    const r = generateIncomingMessageTriggers(validParamsSingle);
    expect(r).toContain('logging.error');
  });

  it('синтаксически корректный Python — нет незакрытых скобок', () => {
    const r = generateIncomingMessageTriggers(validParamsSingle);
    const opens = (r.match(/\(/g) || []).length;
    const closes = (r.match(/\)/g) || []).length;
    expect(opens).toBe(closes);
  });

  it('содержит проверку _stop_processing при stopOnFlag', () => {
    const r = generateIncomingMessageTriggers(validParamsSingle);
    expect(r).toContain("_stop_processing");
    expect(r).toContain('return None');
  });

  it('несколько триггеров генерируют несколько middleware', () => {
    const r = generateIncomingMessageTriggers(validParamsMultiple);
    expect(r).toContain('incoming_message_trigger_trigger_1_middleware');
    expect(r).toContain('incoming_message_trigger_trigger_2_middleware');
  });

  it('фильтр group генерирует проверку типа чата', () => {
    const r = generateIncomingMessageTriggers(validParamsGroupFilter);
    expect(r).toContain("'group', 'supergroup'");
    expect(r).toContain('2300967595');
  });
});

// ─── incomingMessageTriggerParamsSchema ──────────────────────────────────────

describe('incomingMessageTriggerParamsSchema', () => {
  it('принимает валидные параметры', () => {
    expect(incomingMessageTriggerParamsSchema.safeParse(validParamsSingle).success).toBe(true);
  });

  it('принимает пустой массив', () => {
    expect(incomingMessageTriggerParamsSchema.safeParse(validParamsEmpty).success).toBe(true);
  });

  it('принимает несколько триггеров', () => {
    expect(incomingMessageTriggerParamsSchema.safeParse(validParamsMultiple).success).toBe(true);
  });

  it('отклоняет отсутствие обязательного поля nodeId', () => {
    const invalid = { entries: [{ targetNodeId: 'msg_1', targetNodeType: 'message' }] };
    expect(incomingMessageTriggerParamsSchema.safeParse(invalid).success).toBe(false);
  });
});

// ─── collectIncomingMessageTriggerEntries() ───────────────────────────────────

describe('collectIncomingMessageTriggerEntries()', () => {
  it('собирает триггер с правильными полями', () => {
    const entries = collectIncomingMessageTriggerEntries(nodesWithTrigger);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('trigger_1');
    expect(entries[0].targetNodeId).toBe('msg_hello');
    expect(entries[0].targetNodeType).toBe('message');
    expect(entries[0].chatTypeFilter).toBe('any');
  });

  it('пропускает триггер без autoTransitionTo', () => {
    expect(collectIncomingMessageTriggerEntries(nodesWithMissingTarget)).toHaveLength(0);
  });

  it('пропускает узлы не типа incoming_message_trigger', () => {
    expect(collectIncomingMessageTriggerEntries(nodesWithoutTriggers)).toHaveLength(0);
  });

  it('фильтрует null узлы', () => {
    const entries = collectIncomingMessageTriggerEntries(nodesWithNullAndMixed);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('trigger_1');
  });

  it('возвращает пустой массив для пустого входа', () => {
    expect(collectIncomingMessageTriggerEntries([])).toEqual([]);
  });
});

// ─── generateIncomingMessageTriggerHandlers() ─────────────────────────────────

describe('generateIncomingMessageTriggerHandlers()', () => {
  it('пустые узлы → пустая строка', () => {
    expect(generateIncomingMessageTriggerHandlers([])).toBe('');
  });

  it('генерирует код из узлов напрямую', () => {
    const r = generateIncomingMessageTriggerHandlers(nodesWithTrigger);
    expect(r).toContain('incoming_message_trigger_trigger_1_middleware');
    expect(r).toContain('handle_callback_msg_hello');
  });

  it('фильтрует null узлы и не-триггеры', () => {
    const r = generateIncomingMessageTriggerHandlers(nodesWithNullAndMixed);
    expect(r).toContain('incoming_message_trigger_trigger_1_middleware');
  });

  it('узлы без триггеров → пустая строка', () => {
    expect(generateIncomingMessageTriggerHandlers(nodesWithoutTriggers)).toBe('');
  });
});

// ─── Производительность ──────────────────────────────────────────────────────

describe('Производительность', () => {
  it('generateIncomingMessageTriggers: быстрее 100ms', () => {
    const start = Date.now();
    generateIncomingMessageTriggers(validParamsMultiple);
    expect(Date.now() - start).toBeLessThan(100);
  });

  it('generateIncomingMessageTriggerHandlers: быстрее 100ms', () => {
    const start = Date.now();
    generateIncomingMessageTriggerHandlers(nodesWithTrigger);
    expect(Date.now() - start).toBeLessThan(100);
  });
});

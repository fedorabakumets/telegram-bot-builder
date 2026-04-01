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

  it('регистрирует middleware через dp.message.middleware', () => {
    const r = generateIncomingMessageTriggers(validParamsSingle);
    expect(r).toContain('dp.message.middleware(incoming_message_trigger_trigger_1_middleware)');
  });

  it('содержит return await handler(event, data)', () => {
    const r = generateIncomingMessageTriggers(validParamsSingle);
    expect(r).toContain('return await handler(event, data)');
  });

  it('генерирует MockCallback', () => {
    const r = generateIncomingMessageTriggers(validParamsSingle);
    expect(r).toContain('class MockCallback:');
    expect(r).toContain('mock_callback = MockCallback');
  });

  it('вызывает handle_callback с правильным targetNodeId', () => {
    const r = generateIncomingMessageTriggers(validParamsSingle);
    expect(r).toContain('await handle_callback_msg_hello(mock_callback)');
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

  it('несколько триггеров генерируют несколько middleware', () => {
    const r = generateIncomingMessageTriggers(validParamsMultiple);
    expect(r).toContain('incoming_message_trigger_trigger_1_middleware');
    expect(r).toContain('incoming_message_trigger_trigger_2_middleware');
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

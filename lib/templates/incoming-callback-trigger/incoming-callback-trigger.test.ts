/**
 * @fileoverview Тесты для шаблона middleware триггера входящего callback_query
 * @module templates/incoming-callback-trigger/incoming-callback-trigger.test
 */

import { describe, it, expect } from 'vitest';
import {
  generateIncomingCallbackTriggers,
  generateIncomingCallbackTriggerHandlers,
  collectIncomingCallbackTriggerEntries,
} from './incoming-callback-trigger.renderer';
import {
  validParamsEmpty,
  validParamsSingle,
  validParamsMultiple,
  nodesWithTrigger,
  nodesWithMissingTarget,
  nodesWithoutTriggers,
  nodesWithNullAndMixed,
} from './incoming-callback-trigger.fixture';
import { incomingCallbackTriggerParamsSchema } from './incoming-callback-trigger.schema';

// ─── generateIncomingCallbackTriggers() ──────────────────────────────────────

describe('generateIncomingCallbackTriggers()', () => {
  it('пустой массив → пустая строка', () => {
    expect(generateIncomingCallbackTriggers(validParamsEmpty)).toBe('');
  });

  it('генерирует async def middleware функцию', () => {
    const r = generateIncomingCallbackTriggers(validParamsSingle);
    expect(r).toContain('async def incoming_callback_trigger_trigger_1_middleware');
  });

  it('регистрирует middleware через dp.callback_query.middleware', () => {
    const r = generateIncomingCallbackTriggers(validParamsSingle);
    expect(r).toContain('dp.callback_query.middleware(incoming_callback_trigger_trigger_1_middleware)');
  });

  it('содержит return await handler(event, data)', () => {
    const r = generateIncomingCallbackTriggers(validParamsSingle);
    expect(r).toContain('return await handler(event, data)');
  });

  it('генерирует MockCallback', () => {
    const r = generateIncomingCallbackTriggers(validParamsSingle);
    expect(r).toContain('class MockCallback:');
    expect(r).toContain('mock_callback = MockCallback');
  });

  it('вызывает handle_callback с правильным targetNodeId', () => {
    const r = generateIncomingCallbackTriggers(validParamsSingle);
    expect(r).toContain('await handle_callback_msg_hello(mock_callback)');
  });

  it('содержит logging.info с user_id', () => {
    const r = generateIncomingCallbackTriggers(validParamsSingle);
    expect(r).toContain('logging.info');
    expect(r).toContain('user_id');
  });

  it('содержит logging.error для обработки исключений', () => {
    const r = generateIncomingCallbackTriggers(validParamsSingle);
    expect(r).toContain('logging.error');
  });

  it('синтаксически корректный Python — нет незакрытых скобок', () => {
    const r = generateIncomingCallbackTriggers(validParamsSingle);
    const opens = (r.match(/\(/g) || []).length;
    const closes = (r.match(/\)/g) || []).length;
    expect(opens).toBe(closes);
  });

  it('несколько триггеров генерируют несколько middleware', () => {
    const r = generateIncomingCallbackTriggers(validParamsMultiple);
    expect(r).toContain('incoming_callback_trigger_trigger_1_middleware');
    expect(r).toContain('incoming_callback_trigger_trigger_2_middleware');
  });
});

// ─── incomingCallbackTriggerParamsSchema ─────────────────────────────────────

describe('incomingCallbackTriggerParamsSchema', () => {
  it('принимает валидные параметры', () => {
    expect(incomingCallbackTriggerParamsSchema.safeParse(validParamsSingle).success).toBe(true);
  });

  it('принимает пустой массив', () => {
    expect(incomingCallbackTriggerParamsSchema.safeParse(validParamsEmpty).success).toBe(true);
  });

  it('принимает несколько триггеров', () => {
    expect(incomingCallbackTriggerParamsSchema.safeParse(validParamsMultiple).success).toBe(true);
  });

  it('отклоняет отсутствие обязательного поля nodeId', () => {
    const invalid = { entries: [{ targetNodeId: 'msg_1', targetNodeType: 'message' }] };
    expect(incomingCallbackTriggerParamsSchema.safeParse(invalid).success).toBe(false);
  });
});

// ─── collectIncomingCallbackTriggerEntries() ──────────────────────────────────

describe('collectIncomingCallbackTriggerEntries()', () => {
  it('собирает триггер с правильными полями', () => {
    const entries = collectIncomingCallbackTriggerEntries(nodesWithTrigger);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('trigger_1');
    expect(entries[0].targetNodeId).toBe('msg_hello');
    expect(entries[0].targetNodeType).toBe('message');
  });

  it('пропускает триггер без autoTransitionTo', () => {
    expect(collectIncomingCallbackTriggerEntries(nodesWithMissingTarget)).toHaveLength(0);
  });

  it('пропускает узлы не типа incoming_callback_trigger', () => {
    expect(collectIncomingCallbackTriggerEntries(nodesWithoutTriggers)).toHaveLength(0);
  });

  it('фильтрует null узлы', () => {
    const entries = collectIncomingCallbackTriggerEntries(nodesWithNullAndMixed);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('trigger_1');
  });

  it('возвращает пустой массив для пустого входа', () => {
    expect(collectIncomingCallbackTriggerEntries([])).toEqual([]);
  });
});

// ─── generateIncomingCallbackTriggerHandlers() ────────────────────────────────

describe('generateIncomingCallbackTriggerHandlers()', () => {
  it('пустые узлы → пустая строка', () => {
    expect(generateIncomingCallbackTriggerHandlers([])).toBe('');
  });

  it('генерирует код из узлов напрямую', () => {
    const r = generateIncomingCallbackTriggerHandlers(nodesWithTrigger);
    expect(r).toContain('incoming_callback_trigger_trigger_1_middleware');
    expect(r).toContain('handle_callback_msg_hello');
  });

  it('фильтрует null узлы и не-триггеры', () => {
    const r = generateIncomingCallbackTriggerHandlers(nodesWithNullAndMixed);
    expect(r).toContain('incoming_callback_trigger_trigger_1_middleware');
  });

  it('узлы без триггеров → пустая строка', () => {
    expect(generateIncomingCallbackTriggerHandlers(nodesWithoutTriggers)).toBe('');
  });
});

// ─── Middleware специфика ─────────────────────────────────────────────────────

describe('Middleware специфика', () => {
  it('содержит dp.callback_query.middleware', () => {
    const r = generateIncomingCallbackTriggers(validParamsSingle);
    expect(r).toContain('dp.callback_query.middleware');
  });

  it('содержит чтение reply_markup', () => {
    const r = generateIncomingCallbackTriggers(validParamsSingle);
    expect(r).toContain('reply_markup');
    expect(r).toContain('inline_keyboard');
  });

  it('содержит сохранение user_data[user_id]["callback_data"]', () => {
    const r = generateIncomingCallbackTriggers(validParamsSingle);
    expect(r).toContain('user_data[user_id]["callback_data"]');
  });

  it('содержит сохранение user_data[user_id]["button_text"]', () => {
    const r = generateIncomingCallbackTriggers(validParamsSingle);
    expect(r).toContain('user_data[user_id]["button_text"]');
  });

  it('содержит _ict_btn_text', () => {
    const r = generateIncomingCallbackTriggers(validParamsSingle);
    expect(r).toContain('_ict_btn_text');
  });

  it('содержит _is_fake = True в MockCallback', () => {
    const r = generateIncomingCallbackTriggers(validParamsSingle);
    expect(r).toContain('self._is_fake = True');
  });
});

// ─── Производительность ──────────────────────────────────────────────────────

describe('Производительность', () => {
  it('generateIncomingCallbackTriggers: быстрее 100ms', () => {
    const start = Date.now();
    generateIncomingCallbackTriggers(validParamsMultiple);
    expect(Date.now() - start).toBeLessThan(100);
  });

  it('generateIncomingCallbackTriggerHandlers: быстрее 100ms', () => {
    const start = Date.now();
    generateIncomingCallbackTriggerHandlers(nodesWithTrigger);
    expect(Date.now() - start).toBeLessThan(100);
  });
});

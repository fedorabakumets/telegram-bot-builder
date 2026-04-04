/**
 * @fileoverview Тесты для шаблона обработчиков триггеров исходящих сообщений
 * @module templates/outgoing-message-trigger/outgoing-message-trigger.test
 */

import { describe, it, expect } from 'vitest';
import {
  generateOutgoingMessageTriggers,
  generateOutgoingMessageTriggerHandlers,
  collectOutgoingMessageTriggerEntries,
} from './outgoing-message-trigger.renderer';
import {
  validParamsEmpty,
  validParamsSingle,
  validParamsMultiple,
  nodesWithTrigger,
  nodesWithMissingTarget,
  nodesWithoutTriggers,
  nodesWithNullAndMixed,
} from './outgoing-message-trigger.fixture';
import { outgoingMessageTriggerParamsSchema } from './outgoing-message-trigger.schema';

// ─── generateOutgoingMessageTriggers() ───────────────────────────────────────

describe('generateOutgoingMessageTriggers()', () => {
  it('пустой массив → пустая строка', () => {
    expect(generateOutgoingMessageTriggers(validParamsEmpty)).toBe('');
  });

  it('генерирует async def обработчик', () => {
    const r = generateOutgoingMessageTriggers(validParamsSingle);
    expect(r).toContain('async def outgoing_message_trigger_omt_trigger_1_handler');
  });

  it('обработчик содержит last_bot_message_id', () => {
    const r = generateOutgoingMessageTriggers(validParamsSingle);
    expect(r).toContain('last_bot_message_id');
  });

  it('обработчик содержит message_text', () => {
    const r = generateOutgoingMessageTriggers(validParamsSingle);
    expect(r).toContain('message_text');
  });

  it('вызывает handle_callback с правильным targetNodeId', () => {
    const r = generateOutgoingMessageTriggers(validParamsSingle);
    expect(r).toContain('await handle_callback_fwd_to_admin(fake_cb)');
  });

  it('содержит logging.info с user_id', () => {
    const r = generateOutgoingMessageTriggers(validParamsSingle);
    expect(r).toContain('logging.info');
    expect(r).toContain('user_id');
  });

  it('содержит logging.error для обработки исключений', () => {
    const r = generateOutgoingMessageTriggers(validParamsSingle);
    expect(r).toContain('logging.error');
  });

  it('содержит _outgoing_message_trigger_handlers список', () => {
    const r = generateOutgoingMessageTriggers(validParamsSingle);
    expect(r).toContain('_outgoing_message_trigger_handlers');
  });

  it('синтаксически корректный Python — нет незакрытых скобок', () => {
    const r = generateOutgoingMessageTriggers(validParamsSingle);
    const opens = (r.match(/\(/g) || []).length;
    const closes = (r.match(/\)/g) || []).length;
    expect(opens).toBe(closes);
  });

  it('несколько триггеров генерируют несколько обработчиков', () => {
    const r = generateOutgoingMessageTriggers(validParamsMultiple);
    expect(r).toContain('outgoing_message_trigger_omt_trigger_1_handler');
    expect(r).toContain('outgoing_message_trigger_omt_trigger_2_handler');
  });
});

// ─── outgoingMessageTriggerParamsSchema ──────────────────────────────────────

describe('outgoingMessageTriggerParamsSchema', () => {
  it('принимает валидные параметры', () => {
    expect(outgoingMessageTriggerParamsSchema.safeParse(validParamsSingle).success).toBe(true);
  });

  it('принимает пустой массив', () => {
    expect(outgoingMessageTriggerParamsSchema.safeParse(validParamsEmpty).success).toBe(true);
  });

  it('принимает несколько триггеров', () => {
    expect(outgoingMessageTriggerParamsSchema.safeParse(validParamsMultiple).success).toBe(true);
  });

  it('отклоняет отсутствие обязательного поля nodeId', () => {
    const invalid = { entries: [{ targetNodeId: 'msg_1', targetNodeType: 'message' }] };
    expect(outgoingMessageTriggerParamsSchema.safeParse(invalid).success).toBe(false);
  });
});

// ─── collectOutgoingMessageTriggerEntries() ───────────────────────────────────

describe('collectOutgoingMessageTriggerEntries()', () => {
  it('собирает триггер с правильными полями', () => {
    const entries = collectOutgoingMessageTriggerEntries(nodesWithTrigger);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('omt_trigger_1');
    expect(entries[0].targetNodeId).toBe('fwd_to_admin');
    expect(entries[0].targetNodeType).toBe('forward_message');
  });

  it('пропускает триггер без autoTransitionTo', () => {
    expect(collectOutgoingMessageTriggerEntries(nodesWithMissingTarget)).toHaveLength(0);
  });

  it('пропускает узлы не типа outgoing_message_trigger', () => {
    expect(collectOutgoingMessageTriggerEntries(nodesWithoutTriggers)).toHaveLength(0);
  });

  it('фильтрует null узлы', () => {
    const entries = collectOutgoingMessageTriggerEntries(nodesWithNullAndMixed);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('omt_trigger_1');
  });

  it('возвращает пустой массив для пустого входа', () => {
    expect(collectOutgoingMessageTriggerEntries([])).toEqual([]);
  });
});

// ─── generateOutgoingMessageTriggerHandlers() ─────────────────────────────────

describe('generateOutgoingMessageTriggerHandlers()', () => {
  it('пустые узлы → пустая строка', () => {
    expect(generateOutgoingMessageTriggerHandlers([])).toBe('');
  });

  it('генерирует код из узлов напрямую', () => {
    const r = generateOutgoingMessageTriggerHandlers(nodesWithTrigger);
    expect(r).toContain('outgoing_message_trigger_omt_trigger_1_handler');
    expect(r).toContain('handle_callback_fwd_to_admin');
  });

  it('фильтрует null узлы и не-триггеры', () => {
    const r = generateOutgoingMessageTriggerHandlers(nodesWithNullAndMixed);
    expect(r).toContain('outgoing_message_trigger_omt_trigger_1_handler');
  });

  it('узлы без триггеров → пустая строка', () => {
    expect(generateOutgoingMessageTriggerHandlers(nodesWithoutTriggers)).toBe('');
  });
});

// ─── Специфика триггера исходящих ────────────────────────────────────────────

describe('Специфика триггера исходящих', () => {
  it('содержит last_bot_message_id в user_data', () => {
    const r = generateOutgoingMessageTriggers(validParamsSingle);
    expect(r).toContain('user_data[user_id]["last_bot_message_id"]');
  });

  it('содержит message_text в user_data', () => {
    const r = generateOutgoingMessageTriggers(validParamsSingle);
    expect(r).toContain('user_data[user_id]["message_text"]');
  });

  it('содержит _outgoing_message_trigger_handlers список', () => {
    const r = generateOutgoingMessageTriggers(validParamsSingle);
    expect(r).toContain('_outgoing_message_trigger_handlers = [');
  });

  it('содержит FakeCallbackQuery с _is_fake = True', () => {
    const r = generateOutgoingMessageTriggers(validParamsSingle);
    expect(r).toContain('FakeCallbackQuery');
    expect(r).toContain('_is_fake = True');
  });

  it('обработчик принимает user_id, message_id, message_text', () => {
    const r = generateOutgoingMessageTriggers(validParamsSingle);
    expect(r).toContain('user_id: int, message_id, message_text: str');
  });
});

// ─── Производительность ──────────────────────────────────────────────────────

describe('Производительность', () => {
  it('generateOutgoingMessageTriggers: быстрее 100ms', () => {
    const start = Date.now();
    generateOutgoingMessageTriggers(validParamsMultiple);
    expect(Date.now() - start).toBeLessThan(100);
  });

  it('generateOutgoingMessageTriggerHandlers: быстрее 100ms', () => {
    const start = Date.now();
    generateOutgoingMessageTriggerHandlers(nodesWithTrigger);
    expect(Date.now() - start).toBeLessThan(100);
  });
});

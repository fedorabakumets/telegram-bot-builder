/**
 * @fileoverview Тесты для шаблона триггера сообщения в топике форум-группы
 * @module templates/group-message-trigger/group-message-trigger.test
 */

import { describe, it, expect } from 'vitest';
import {
  generateGroupMessageTriggers,
  generateGroupMessageTriggerHandlers,
  collectGroupMessageTriggerEntries,
} from './group-message-trigger.renderer';
import {
  validParamsEmpty,
  validParamsSingleManual,
  validParamsSingleVariable,
  validParamsMultiple,
  nodesWithTrigger,
  nodesWithMissingTarget,
  nodesWithoutTriggers,
  nodesWithNullAndMixed,
  nodesWithVariableSource,
} from './group-message-trigger.fixture';
import { groupMessageTriggerParamsSchema } from './group-message-trigger.schema';

// ─── generateGroupMessageTriggers() ──────────────────────────────────────────

describe('generateGroupMessageTriggers()', () => {
  it('пустой массив → пустая строка', () => {
    expect(generateGroupMessageTriggers(validParamsEmpty)).toBe('');
  });

  it('генерирует @dp.message декоратор с фильтрами', () => {
    const r = generateGroupMessageTriggers(validParamsSingleManual);
    expect(r).toContain("@dp.message(F.chat.type.in_({'group', 'supergroup'}), F.message_thread_id)");
  });

  it('генерирует async def обработчик с safeName', () => {
    const r = generateGroupMessageTriggers(validParamsSingleManual);
    expect(r).toContain('async def group_message_trigger_gmt_1_handler(message: types.Message):');
  });

  it('manual: содержит фильтр по ID группы через _expected_chat_ids', () => {
    const r = generateGroupMessageTriggers(validParamsSingleManual);
    expect(r).toContain("_expected_chat_ids = ('2300967595', '-1002300967595')");
    expect(r).toContain('if str(message.chat.id) not in _expected_chat_ids:');
  });

  it('содержит проверку message_thread_id', () => {
    const r = generateGroupMessageTriggers(validParamsSingleManual);
    expect(r).toContain('_thread_id = message.message_thread_id');
    expect(r).toContain('if not _thread_id:');
  });

  it('содержит JSONB-запрос с threadIdVariable', () => {
    const r = generateGroupMessageTriggers(validParamsSingleManual);
    expect(r).toContain("user_data->>'support_thread_id'");
    expect(r).toContain('SELECT user_id FROM bot_users');
  });

  it('не содержит project_id фильтра (bot_users не имеет этого столбца)', () => {
    const r = generateGroupMessageTriggers(validParamsSingleManual);
    expect(r).not.toContain('project_id = $1');
    expect(r).not.toContain('_project_id = globals().get(\'PROJECT_ID\')');
  });

  it('содержит вызов set_user_var с resolvedUserIdVariable', () => {
    const r = generateGroupMessageTriggers(validParamsSingleManual);
    expect(r).toContain("await set_user_var(_resolved_user_id, 'resolved_user_id', str(_resolved_user_id))");
  });

  it('содержит вызов handle_callback_ с targetNodeId', () => {
    const r = generateGroupMessageTriggers(validParamsSingleManual);
    expect(r).toContain('await handle_callback_msg_reply(mock_callback)');
  });

  it('содержит MockCallback класс', () => {
    const r = generateGroupMessageTriggers(validParamsSingleManual);
    expect(r).toContain('class MockCallback:');
    expect(r).toContain('mock_callback = MockCallback(');
  });

  it('содержит logging.info и logging.warning', () => {
    const r = generateGroupMessageTriggers(validParamsSingleManual);
    expect(r).toContain('logging.info(');
    expect(r).toContain('logging.warning(');
  });

  it('variable: содержит чтение переменной группы', () => {
    const r = generateGroupMessageTriggers(validParamsSingleVariable);
    expect(r).toContain("'group_chat_id'");
    expect(r).toContain('_expected_group_ids');
  });

  it('несколько триггеров генерируют несколько обработчиков', () => {
    const r = generateGroupMessageTriggers(validParamsMultiple);
    expect(r).toContain('group_message_trigger_gmt_1_handler');
    expect(r).toContain('group_message_trigger_gmt_2_handler');
  });

  it('несколько триггеров — каждый со своим threadIdVariable', () => {
    const r = generateGroupMessageTriggers(validParamsMultiple);
    expect(r).toContain("user_data->>'support_thread_id'");
    expect(r).toContain("user_data->>'sales_thread_id'");
  });

  it('синтаксически корректный Python — нет незакрытых скобок', () => {
    const r = generateGroupMessageTriggers(validParamsSingleManual);
    const opens = (r.match(/\(/g) || []).length;
    const closes = (r.match(/\)/g) || []).length;
    expect(opens).toBe(closes);
  });
});

// ─── groupMessageTriggerParamsSchema ─────────────────────────────────────────

describe('groupMessageTriggerParamsSchema', () => {
  it('принимает валидные параметры manual', () => {
    expect(groupMessageTriggerParamsSchema.safeParse(validParamsSingleManual).success).toBe(true);
  });

  it('принимает валидные параметры variable', () => {
    expect(groupMessageTriggerParamsSchema.safeParse(validParamsSingleVariable).success).toBe(true);
  });

  it('принимает пустой массив', () => {
    expect(groupMessageTriggerParamsSchema.safeParse(validParamsEmpty).success).toBe(true);
  });

  it('принимает несколько триггеров', () => {
    expect(groupMessageTriggerParamsSchema.safeParse(validParamsMultiple).success).toBe(true);
  });

  it('отклоняет отсутствие обязательного поля nodeId', () => {
    const invalid = {
      entries: [{
        safeName: 'gmt_1',
        groupChatId: '123',
        groupChatIdSource: 'manual',
        groupChatVariableName: '',
        threadIdVariable: 'tid',
        resolvedUserIdVariable: 'uid',
        targetNodeId: 'msg',
        targetNodeType: 'message',
      }],
    };
    expect(groupMessageTriggerParamsSchema.safeParse(invalid).success).toBe(false);
  });

  it('отклоняет невалидный groupChatIdSource', () => {
    const invalid = {
      entries: [{
        nodeId: 'gmt_1',
        safeName: 'gmt_1',
        groupChatId: '123',
        groupChatIdSource: 'unknown',
        groupChatVariableName: '',
        threadIdVariable: 'tid',
        resolvedUserIdVariable: 'uid',
        targetNodeId: 'msg',
        targetNodeType: 'message',
      }],
    };
    expect(groupMessageTriggerParamsSchema.safeParse(invalid).success).toBe(false);
  });
});

// ─── collectGroupMessageTriggerEntries() ─────────────────────────────────────

describe('collectGroupMessageTriggerEntries()', () => {
  it('собирает триггер с правильными полями', () => {
    const entries = collectGroupMessageTriggerEntries(nodesWithTrigger);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('gmt_1');
    expect(entries[0].targetNodeId).toBe('msg_reply');
    expect(entries[0].threadIdVariable).toBe('support_thread_id');
    expect(entries[0].resolvedUserIdVariable).toBe('resolved_user_id');
  });

  it('safeName генерируется из nodeId', () => {
    const entries = collectGroupMessageTriggerEntries(nodesWithTrigger);
    expect(entries[0].safeName).toBe('gmt_1');
  });

  it('пропускает триггер без autoTransitionTo', () => {
    expect(collectGroupMessageTriggerEntries(nodesWithMissingTarget)).toHaveLength(0);
  });

  it('пропускает узлы не типа group_message_trigger', () => {
    expect(collectGroupMessageTriggerEntries(nodesWithoutTriggers)).toHaveLength(0);
  });

  it('фильтрует null узлы', () => {
    const entries = collectGroupMessageTriggerEntries(nodesWithNullAndMixed);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('gmt_1');
  });

  it('возвращает пустой массив для пустого входа', () => {
    expect(collectGroupMessageTriggerEntries([])).toEqual([]);
  });

  it('variable source: groupChatIdSource = variable', () => {
    const entries = collectGroupMessageTriggerEntries(nodesWithVariableSource);
    expect(entries[0].groupChatIdSource).toBe('variable');
    expect(entries[0].groupChatVariableName).toBe('my_group_id');
  });

  it('определяет targetNodeType из соседнего узла', () => {
    const entries = collectGroupMessageTriggerEntries(nodesWithTrigger);
    expect(entries[0].targetNodeType).toBe('message');
  });
});

// ─── generateGroupMessageTriggerHandlers() ───────────────────────────────────

describe('generateGroupMessageTriggerHandlers()', () => {
  it('пустые узлы → пустая строка', () => {
    expect(generateGroupMessageTriggerHandlers([])).toBe('');
  });

  it('генерирует код из узлов напрямую', () => {
    const r = generateGroupMessageTriggerHandlers(nodesWithTrigger);
    expect(r).toContain('group_message_trigger_gmt_1_handler');
    expect(r).toContain('handle_callback_msg_reply');
  });

  it('фильтрует null узлы и не-триггеры', () => {
    const r = generateGroupMessageTriggerHandlers(nodesWithNullAndMixed);
    expect(r).toContain('group_message_trigger_gmt_1_handler');
  });

  it('узлы без триггеров → пустая строка', () => {
    expect(generateGroupMessageTriggerHandlers(nodesWithoutTriggers)).toBe('');
  });

  it('variable source генерирует обработчик', () => {
    const r = generateGroupMessageTriggerHandlers(nodesWithVariableSource);
    expect(r).toContain('group_message_trigger_gmt_var_handler');
  });
});

// ─── Производительность ──────────────────────────────────────────────────────

describe('Производительность', () => {
  it('generateGroupMessageTriggers: быстрее 100ms', () => {
    const start = Date.now();
    generateGroupMessageTriggers(validParamsMultiple);
    expect(Date.now() - start).toBeLessThan(100);
  });

  it('generateGroupMessageTriggerHandlers: быстрее 100ms', () => {
    const start = Date.now();
    generateGroupMessageTriggerHandlers(nodesWithTrigger);
    expect(Date.now() - start).toBeLessThan(100);
  });
});

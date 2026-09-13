/**
 * @fileoverview Тесты для шаблона обработчиков триггера участника
 * @module templates/member-trigger/member-trigger.test
 */

import { describe, it, expect } from 'vitest';
import {
  generateMemberTriggers,
  generateMemberTriggerHandlers,
  collectMemberTriggerEntries,
} from './member-trigger.renderer';
import {
  validParamsEmpty,
  validParamsJoin,
  validParamsLeave,
  validParamsMultiple,
  nodesWithTrigger,
  nodesWithMissingTarget,
  nodesWithoutTriggers,
  nodesWithNullAndMixed,
  nodesWithVariableFilter,
} from './member-trigger.fixture';
import { memberTriggerParamsSchema } from './member-trigger.schema';

describe('generateMemberTriggers()', () => {
  it('пустой массив → пустая строка', () => {
    expect(generateMemberTriggers(validParamsEmpty)).toBe('');
  });

  it('генерирует @dp.message(F.new_chat_members) для join', () => {
    const r = generateMemberTriggers(validParamsJoin);
    expect(r).toContain('@dp.message(F.new_chat_members)');
    expect(r).toContain('member_trigger_member_trigger_1_join_handler');
  });

  it('генерирует @dp.message(F.left_chat_member) для leave', () => {
    const r = generateMemberTriggers(validParamsLeave);
    expect(r).toContain('@dp.message(F.left_chat_member)');
    expect(r).toContain('member_trigger_member_trigger_2_leave_handler');
  });

  it('содержит capture_message_context', () => {
    const r = generateMemberTriggers(validParamsJoin);
    expect(r).toContain('await capture_message_context(user_id, message)');
  });

  it('сохраняет joined_user_id в user_data', () => {
    const r = generateMemberTriggers(validParamsJoin);
    expect(r).toContain('user_data[user_id]["joined_user_id"]');
  });

  it('вызывает handle_callback с правильным targetNodeId', () => {
    const r = generateMemberTriggers(validParamsJoin);
    expect(r).toContain('await handle_callback_msg_1(fake_cb');
  });

  it('содержит фильтр groupChatId для manual', () => {
    const r = generateMemberTriggers(validParamsLeave);
    expect(r).toContain('_expected_chat_ids');
    expect(r).toContain('2300967595');
  });

  it('содержит logging.info и logging.error', () => {
    const r = generateMemberTriggers(validParamsJoin);
    expect(r).toContain('logging.info');
    expect(r).toContain('logging.error');
  });

  it('both генерирует join и leave обработчики', () => {
    const r = generateMemberTriggers(validParamsMultiple);
    expect(r).toContain('member_trigger_member_trigger_2_join_handler');
    expect(r).toContain('member_trigger_member_trigger_2_leave_handler');
  });

  it('FakeCallbackQuery содержит self.message', () => {
    const r = generateMemberTriggers(validParamsJoin);
    expect(r).toContain('self.message = msg');
    expect(r).toContain('self._is_fake = True');
  });
});

describe('memberTriggerParamsSchema', () => {
  it('принимает валидные параметры join', () => {
    expect(memberTriggerParamsSchema.safeParse(validParamsJoin).success).toBe(true);
  });

  it('принимает пустой массив', () => {
    expect(memberTriggerParamsSchema.safeParse(validParamsEmpty).success).toBe(true);
  });

  it('принимает несколько триггеров', () => {
    expect(memberTriggerParamsSchema.safeParse(validParamsMultiple).success).toBe(true);
  });

  it('отклоняет отсутствие обязательного поля nodeId', () => {
    const invalid = { entries: [{ targetNodeId: 'msg_1', targetNodeType: 'message', memberEventType: 'join', groupChatIdSource: 'manual', hasGroupChatFilter: false }] };
    expect(memberTriggerParamsSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('collectMemberTriggerEntries()', () => {
  it('собирает триггеры из узлов', () => {
    const entries = collectMemberTriggerEntries(nodesWithTrigger);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('member_trigger_1');
    expect(entries[0].memberEventType).toBe('join');
  });

  it('пропускает узлы без autoTransitionTo', () => {
    expect(collectMemberTriggerEntries(nodesWithMissingTarget)).toHaveLength(0);
  });

  it('возвращает пустой массив без member_trigger', () => {
    expect(collectMemberTriggerEntries(nodesWithoutTriggers)).toHaveLength(0);
  });

  it('игнорирует null-узлы', () => {
    const entries = collectMemberTriggerEntries(nodesWithNullAndMixed);
    expect(entries).toHaveLength(1);
    expect(entries[0].memberEventType).toBe('leave');
  });

  it('определяет hasGroupChatFilter для variable', () => {
    const entries = collectMemberTriggerEntries(nodesWithVariableFilter);
    expect(entries[0].hasGroupChatFilter).toBe(true);
    expect(entries[0].groupChatVariableName).toBe('group_chat_id');
  });
});

describe('generateMemberTriggerHandlers()', () => {
  it('генерирует код из узлов', () => {
    const r = generateMemberTriggerHandlers(nodesWithTrigger);
    expect(r).toContain('F.new_chat_members');
  });

  it('возвращает пустую строку без триггеров', () => {
    expect(generateMemberTriggerHandlers(nodesWithoutTriggers)).toBe('');
  });

  it('итерирует new_chat_members', () => {
    const r = generateMemberTriggerHandlers(nodesWithTrigger);
    expect(r).toContain('for new_member in message.new_chat_members');
  });

  it('пропускает ботов при join', () => {
    const r = generateMemberTriggerHandlers(nodesWithTrigger);
    expect(r).toContain('if new_member.is_bot');
  });
});

describe('специфика member_trigger', () => {
  it('leave сохраняет left_user_id', () => {
    const r = generateMemberTriggers(validParamsLeave);
    expect(r).toContain('user_data[user_id]["left_user_id"]');
  });

  it('variable filter использует groupChatVariableName', () => {
    const r = generateMemberTriggerHandlers(nodesWithVariableFilter);
    expect(r).toContain('group_chat_id');
    expect(r).toContain('_group_chat_id_var');
  });

  it('leave проверяет left_chat_member', () => {
    const r = generateMemberTriggers(validParamsLeave);
    expect(r).toContain('left_member = message.left_chat_member');
  });

  it('join не содержит left_chat_member handler когда только join', () => {
    const r = generateMemberTriggers(validParamsJoin);
    expect(r).not.toContain('F.left_chat_member');
  });

  it('leave не содержит new_chat_members когда только leave', () => {
    const r = generateMemberTriggers(validParamsLeave);
    expect(r).not.toContain('F.new_chat_members');
  });
});

describe('производительность', () => {
  it('обрабатывает 50 триггеров без ошибок', () => {
    const entries = Array.from({ length: 50 }, (_, i) => ({
      nodeId: `member_${i}`,
      targetNodeId: `msg_${i}`,
      targetNodeType: 'message',
      memberEventType: 'join' as const,
      groupChatIdSource: 'manual' as const,
      hasGroupChatFilter: false,
    }));
    const r = generateMemberTriggers({ entries });
    expect(r.length).toBeGreaterThan(1000);
  });

  it('collectMemberTriggerEntries быстро обрабатывает 100 узлов', () => {
    const nodes = Array.from({ length: 100 }, (_, i) => ({
      id: `member_${i}`,
      type: 'member_trigger',
      position: { x: 0, y: 0 },
      data: { autoTransitionTo: `msg_${i}`, memberEventType: 'join', groupChatIdSource: 'manual' },
    })) as any[];
    const start = Date.now();
    const entries = collectMemberTriggerEntries(nodes);
    expect(entries).toHaveLength(100);
    expect(Date.now() - start).toBeLessThan(500);
  });
});

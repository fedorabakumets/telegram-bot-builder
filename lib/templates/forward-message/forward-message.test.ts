/**
 * @fileoverview Тесты шаблона пересылки сообщения.
 * @module templates/forward-message/forward-message.test
 */

import { describe, expect, it } from 'vitest';
import { generateForwardMessage, generateForwardMessageFromNode, nodeToForwardMessageParams } from './forward-message.renderer';
import { forwardMessageParamsSchema } from './forward-message.schema';
import {
  validParamsBasic,
  validParamsLastMessage,
  validParamsMixedTargets,
  validParamsGroupTarget,
  validParamsUserTarget,
  validParamsMixedChatTypes,
  validParamsGroupWithThread,
  forwardMessageNodeBasic,
  forwardMessageNodeLegacyTargets,
} from './forward-message.fixture';

describe('generateForwardMessage()', () => {
  it('returns Python code for a single manual target', () => {
    const code = generateForwardMessage(validParamsBasic);
    expect(code).toContain('@dp.callback_query(lambda c: c.data == "forward_1")');
    expect(code).toContain('bot.forward_message(');
    expect(code).toContain('disable_notification=True');
    expect(code).toContain('source_message_id = callback_query.message.message_id');
  });

  it('supports variable and admin_ids targets', () => {
    const code = generateForwardMessage(validParamsMixedTargets);
    expect(code).toContain('ADMIN_IDS');
    expect(code).toContain('init_all_user_vars(user_id)');
    expect(code).toContain('target_chat_ids.append(admin_id)');
    expect(code).toContain('target_chat_ids.append(_normalized_target_chat_id)');
    expect(code).toContain('disable_notification=False');
  });

  it('supports last_message and linked source node lookup through bot_messages', () => {
    const code = generateForwardMessage(validParamsLastMessage);
    expect(code).toContain('linked_node_id=linked_source_node_id');
    expect(code).toContain('use_last_logged=True');
    expect(code).toContain('FROM bot_messages');
    expect(code).toContain('AND node_id = $3');
  });

  it('does not double-quote linked source node ids', () => {
    const code = generateForwardMessage(validParamsLastMessage);
    expect(code).toContain(`linked_source_node_id = 'message_source'`);
    expect(code).not.toContain(`linked_source_node_id = "'message_source'"`);
  });

  it('does not double-quote manual target chat ids', () => {
    const code = generateForwardMessage(validParamsMixedTargets);
    expect(code).toContain(`_raw_target_chat_id = '@channel_name'`);
    expect(code).not.toContain(`_raw_target_chat_id = "'@channel_name'"`);
  });

  it('validates params through zod schema', () => {
    expect(() => forwardMessageParamsSchema.parse(validParamsBasic)).not.toThrow();
  });
});

describe('nodeToForwardMessageParams()', () => {
  it('normalizes new style targetChatTargets', () => {
    const params = nodeToForwardMessageParams(forwardMessageNodeBasic);
    expect(params.sourceMessageIdSource).toBe('current_message');
    expect(params.targetRecipients).toHaveLength(1);
    expect(params.targetRecipients[0].targetChatIdSource).toBe('manual');
  });

  it('falls back to legacy target fields', () => {
    const params = nodeToForwardMessageParams(forwardMessageNodeLegacyTargets);
    expect(params.sourceMessageIdSource).toBe('manual');
    expect(params.sourceMessageId).toBe('12345');
    expect(params.targetRecipients).toHaveLength(1);
    expect(params.targetRecipients[0].targetChatIdSource).toBe('variable');
    expect(params.targetRecipients[0].targetChatVariableName).toBe('target_chat_id');
  });
});

describe('generateForwardMessageFromNode()', () => {
  it('renders code from a graph node', () => {
    const code = generateForwardMessageFromNode(forwardMessageNodeBasic);
    expect(code).toContain('forward_message node forward_1');
    expect(code).toContain('await callback_query.answer("Сообщение переслано")');
  });
});

describe('targetChatType — нормализация ID группы/канала', () => {
  it('targetChatType=group генерирует -100 нормализацию', () => {
    const code = generateForwardMessage(validParamsGroupTarget);
    expect(code).toContain("if 'group' == 'group'");
  });

  it('targetChatType=user НЕ генерирует активную -100 нормализацию', () => {
    const code = generateForwardMessage(validParamsUserTarget);
    expect(code).toContain("if 'user' == 'group'");
    expect(code).not.toContain("if 'group' == 'group'");
  });

  it('targetChatType=group без указания → дефолт user в рендерере', () => {
    const params = nodeToForwardMessageParams({
      id: 'fwd_no_type',
      type: 'forward_message',
      position: { x: 0, y: 0 },
      data: {
        targetChatTargets: [{ id: 'r1', targetChatIdSource: 'manual', targetChatId: '999' }],
      } as any,
    });
    expect(params.targetRecipients[0].targetChatType).toBe('user');
  });

  it('targetChatType=group передаётся через nodeToForwardMessageParams', () => {
    const params = nodeToForwardMessageParams({
      id: 'fwd_group',
      type: 'forward_message',
      position: { x: 0, y: 0 },
      data: {
        targetChatTargets: [{ id: 'r1', targetChatIdSource: 'manual', targetChatId: '2300967595', targetChatType: 'group' }],
      } as any,
    });
    expect(params.targetRecipients[0].targetChatType).toBe('group');
  });

  it('смешанные типы user+group оба присутствуют в коде', () => {
    const code = generateForwardMessage(validParamsMixedChatTypes);
    expect(code).toContain("if 'user' == 'group'");
    expect(code).toContain("if 'group' == 'group'");
  });

  it('targetChatType=group + @username синтаксически корректен', () => {
    const code = generateForwardMessage({
      nodeId: 'fwd_username',
      safeName: 'fwd_username',
      sourceMessageIdSource: 'current_message',
      targetRecipients: [{ id: 'r1', targetChatIdSource: 'manual', targetChatId: '@mychannel', targetChatType: 'group' }],
      disableNotification: false,
    });
    expect(code).toContain("if 'group' == 'group'");
    expect(code).toContain("'@mychannel'");
  });
});

describe('targetThreadId — пересылка в топик форум-группы', () => {
  it('targetThreadId set → message_thread_id присутствует в коде', () => {
    const code = generateForwardMessage(validParamsGroupWithThread);
    expect(code).toContain('target_thread_ids');
    expect(code).toContain("'615'");
  });

  it('targetThreadId set → message_thread_id передаётся в bot.forward_message', () => {
    const code = generateForwardMessage(validParamsGroupWithThread);
    expect(code).toContain('message_thread_id=target_thread_ids.get(target_chat_id)');
  });

  it('targetThreadId пустой → target_thread_ids остаётся пустым словарём', () => {
    const code = generateForwardMessage(validParamsGroupTarget);
    expect(code).toContain('target_thread_ids = {}');
    expect(code).not.toContain("int('')");
  });

  it('targetThreadId set → синтаксически корректен', () => {
    const code = generateForwardMessage(validParamsGroupWithThread);
    expect(code).toContain('message_thread_id=target_thread_ids.get(target_chat_id)');
    // schema validation passes
    expect(() => forwardMessageParamsSchema.parse(validParamsGroupWithThread)).not.toThrow();
  });

  it('targetThreadId передаётся через nodeToForwardMessageParams', () => {
    const params = nodeToForwardMessageParams({
      id: 'fwd_thread',
      type: 'forward_message',
      position: { x: 0, y: 0 },
      data: {
        targetChatTargets: [{
          id: 'r1',
          targetChatIdSource: 'manual',
          targetChatId: '2300967595',
          targetChatType: 'group',
          targetThreadId: '615',
        }],
      } as any,
    });
    expect(params.targetRecipients[0].targetThreadId).toBe('615');
  });
});

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

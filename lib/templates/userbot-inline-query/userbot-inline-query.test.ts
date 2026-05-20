/**
 * @fileoverview Unit-тесты для шаблона userbot-inline-query
 * @module templates/userbot-inline-query/userbot-inline-query.test
 */

import { describe, it, expect } from 'vitest';
import { generateUserbotInlineQuery, generateUserbotInlineQueryHandlers } from './userbot-inline-query.renderer';
import { userbotInlineQueryParamsSchema } from './userbot-inline-query.schema';
import type { Node } from '@shared/schema';

describe('generateUserbotInlineQuery()', () => {
  it('генерирует обработчик с handle_callback_', () => {
    const code = generateUserbotInlineQuery({ nodeId: 'ub-iq-1', botUsername: '@bot' });
    expect(code).toContain('handle_callback_ub_iq_1');
  });

  it('содержит inline_query вызов', () => {
    const code = generateUserbotInlineQuery({ nodeId: 'ub-iq-2', botUsername: '@bot', query: 'test' });
    expect(code).toContain('userbot_client.inline_query');
  });

  it('содержит _result.click для отправки результата', () => {
    const code = generateUserbotInlineQuery({ nodeId: 'ub-iq-3', botUsername: '@bot' });
    expect(code).toContain('_result.click(');
  });

  it('projectId → get_content для bot, query, target', () => {
    const code = generateUserbotInlineQuery({
      nodeId: 'ub-iq-4',
      botUsername: '@inline_bot',
      query: 'search',
      targetChat: '@chat',
      sendToSameChat: false,
      projectId: 5,
    });
    expect(code).toContain('get_content("ub-iq-4.bot"');
    expect(code).toContain('get_content("ub-iq-4.query"');
    expect(code).toContain('get_content("ub-iq-4.target"');
  });

  it('без projectId → нет get_content', () => {
    const code = generateUserbotInlineQuery({ nodeId: 'ub-iq-5', botUsername: '@bot', projectId: null });
    expect(code).not.toContain('get_content');
  });

  it('saveResultTitleTo → сохраняет title', () => {
    const code = generateUserbotInlineQuery({ nodeId: 'ub-iq-6', saveResultTitleTo: 'my_title' });
    expect(code).toContain('my_title');
    expect(code).toContain("getattr(_result, 'title'");
    expect(code).toContain('set_user_var');
  });

  it('saveResultDescTo → сохраняет description', () => {
    const code = generateUserbotInlineQuery({ nodeId: 'ub-iq-7', saveResultDescTo: 'my_desc' });
    expect(code).toContain('my_desc');
    expect(code).toContain("getattr(_result, 'description'");
    expect(code).toContain('set_user_var');
  });

  it('saveResponseIdTo → сохраняет ID сообщения', () => {
    const code = generateUserbotInlineQuery({ nodeId: 'ub-iq-8', saveResponseIdTo: 'msg_id' });
    expect(code).toContain('msg_id');
    expect(code).toContain('_sent.id');
    expect(code).toContain('set_user_var');
  });

  it('autoTransitionTo → FakeCallbackQuery', () => {
    const code = generateUserbotInlineQuery({ nodeId: 'ub-iq-9', autoTransitionTo: 'next-step' });
    expect(code).toContain('handle_callback_next_step');
    expect(code).toContain('FakeCallbackQuery');
  });

  it('содержит FloodWait обработку', () => {
    const code = generateUserbotInlineQuery({ nodeId: 'ub-iq-10' });
    expect(code).toContain('FloodWaitError');
    expect(code).toContain('asyncio.sleep');
  });

  it('sendToSameChat=true → _target_chat = _bot', () => {
    const code = generateUserbotInlineQuery({ nodeId: 'ub-iq-11', sendToSameChat: true, botUsername: '@bot' });
    expect(code).toContain('_target_chat = _bot');
  });

  it('sendToSameChat=false → резолвит targetChat отдельно', () => {
    const code = generateUserbotInlineQuery({ nodeId: 'ub-iq-12', sendToSameChat: false, targetChat: '@channel' });
    expect(code).not.toContain('_target_chat = _bot');
    expect(code).toContain('_target_raw');
  });
});

describe('userbotInlineQueryParamsSchema', () => {
  it('валидирует минимальные параметры', () => {
    const result = userbotInlineQueryParamsSchema.parse({ nodeId: 'test' });
    expect(result.nodeId).toBe('test');
    expect(result.sendToSameChat).toBe(true);
    expect(result.resultIndex).toBe('0');
  });

  it('применяет дефолтные значения', () => {
    const result = userbotInlineQueryParamsSchema.parse({ nodeId: 'x' });
    expect(result.botUsername).toBe('');
    expect(result.query).toBe('');
    expect(result.targetChat).toBe('');
    expect(result.sendToSameChat).toBe(true);
    expect(result.resultIndex).toBe('0');
    expect(result.projectId).toBeNull();
  });

  it('валидирует полные параметры', () => {
    const result = userbotInlineQueryParamsSchema.parse({
      nodeId: 'ub-iq-1',
      botUsername: '@bot',
      query: 'search',
      targetChat: '@chat',
      sendToSameChat: false,
      resultIndex: '2',
      saveResultTitleTo: 't',
      saveResultDescTo: 'd',
      saveResponseIdTo: 'r',
      autoTransitionTo: 'next',
      projectId: 3,
    });
    expect(result.sendToSameChat).toBe(false);
    expect(result.resultIndex).toBe('2');
    expect(result.projectId).toBe(3);
  });

  it('отклоняет невалидный nodeId (не строка)', () => {
    expect(() => userbotInlineQueryParamsSchema.parse({ nodeId: 123 })).toThrow();
  });
});

describe('generateUserbotInlineQueryHandlers()', () => {
  it('возвращает пустую строку без userbot_inline_query нод', () => {
    const nodes = [{ id: 'msg-1', type: 'message', position: { x: 0, y: 0 }, data: {} }] as Node[];
    expect(generateUserbotInlineQueryHandlers(nodes)).toBe('');
  });

  it('генерирует код для userbot_inline_query нод', () => {
    const nodes = [{
      id: 'ub-iq-1', type: 'userbot_inline_query' as any, position: { x: 0, y: 0 },
      data: { botUsername: '@bot', query: 'test' },
    }] as Node[];
    const code = generateUserbotInlineQueryHandlers(nodes, 1);
    expect(code).toContain('handle_callback_ub_iq_1');
    expect(code).toContain('get_content');
    expect(code).toContain('inline_query');
  });

  it('генерирует несколько обработчиков', () => {
    const nodes = [
      { id: 'iq1', type: 'userbot_inline_query' as any, position: { x: 0, y: 0 }, data: { botUsername: '@a' } },
      { id: 'iq2', type: 'userbot_inline_query' as any, position: { x: 0, y: 0 }, data: { botUsername: '@b' } },
    ] as Node[];
    const code = generateUserbotInlineQueryHandlers(nodes);
    expect(code).toContain('handle_callback_iq1');
    expect(code).toContain('handle_callback_iq2');
  });
});

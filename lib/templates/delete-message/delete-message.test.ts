/**
 * @fileoverview Тест шаблона delete_message
 * Проверяет генерацию Python-кода для всех режимов удаления сообщений
 */

import { describe, it, expect } from 'vitest';
import {
  generateDeleteMessage,
  generateDeleteMessageHandlers,
  collectDeleteMessageEntries,
} from './delete-message.renderer';
import {
  fixtureDeleteCurrentMessage,
  fixtureDeleteLastBotMessage,
  fixtureDeleteLastN,
  fixtureDeleteLastNVariable,
  fixtureDeleteCustomId,
  fixtureDeleteBulk,
  fixtureDeleteCustomChat,
} from './delete-message.fixture';
import type { Node } from '@shared/schema';

// ─── generateDeleteMessage() ─────────────────────────────────────────────────

describe('generateDeleteMessage()', () => {
  it('пустые entries → пустая строка', () => {
    expect(generateDeleteMessage({ entries: [] })).toBe('');
  });

  it('current_message: генерирует bot.delete_message', () => {
    const r = generateDeleteMessage(fixtureDeleteCurrentMessage);
    expect(r).toContain('bot.delete_message');
    expect(r).toContain('callback_query.message.message_id');
    expect(r).toContain('del_current_1');
  });

  it('last_bot_message: использует user_data last_bot_message_id', () => {
    const r = generateDeleteMessage(fixtureDeleteLastBotMessage);
    expect(r).toContain('last_bot_message_id');
    expect(r).toContain('bot.delete_message');
  });

  it('last_bot_message: генерирует автопереход', () => {
    const r = generateDeleteMessage(fixtureDeleteLastBotMessage);
    expect(r).toContain('handle_callback_next_node_1');
  });

  it('last_n: генерирует диапазон ID и deleteMessages', () => {
    const r = generateDeleteMessage(fixtureDeleteLastN);
    expect(r).toContain('range(');
    expect(r).toContain('bot.delete_messages');
    expect(r).toContain('50');
  });

  it('last_n с переменной: подставляет через replace_variables_in_text', () => {
    const r = generateDeleteMessage(fixtureDeleteLastNVariable);
    expect(r).toContain('replace_variables_in_text');
    expect(r).toContain('{count}');
  });

  it('custom: подставляет переменную в message_id', () => {
    const r = generateDeleteMessage(fixtureDeleteCustomId);
    expect(r).toContain('replace_variables_in_text');
    expect(r).toContain('saved_msg_id');
  });

  it('bulkDelete: парсит JSON массив и удаляет батчами', () => {
    const r = generateDeleteMessage(fixtureDeleteBulk);
    expect(r).toContain('old_message_ids');
    expect(r).toContain('json');
    expect(r).toContain('bot.delete_messages');
    expect(r).toContain('100');
  });

  it('custom chat: подставляет chat_id и добавляет -100', () => {
    const r = generateDeleteMessage(fixtureDeleteCustomChat);
    expect(r).toContain('-1001234567890');
  });

  it('ignoreErrors=false: нет try/except вокруг delete', () => {
    const r = generateDeleteMessage(fixtureDeleteCustomChat);
    // ignoreErrors=false — не должно быть logging.warning для ошибок удаления
    expect(r).not.toContain('logging.warning(f"delete_message del_other_chat');
  });

  it('ignoreErrors=true: есть try/except', () => {
    const r = generateDeleteMessage(fixtureDeleteCurrentMessage);
    expect(r).toContain('try:');
    expect(r).toContain('except Exception');
  });
});

// ─── collectDeleteMessageEntries() ──────────────────────────────────────────

describe('collectDeleteMessageEntries()', () => {
  it('пустой массив → пустой результат', () => {
    expect(collectDeleteMessageEntries([])).toEqual([]);
  });

  it('находит узлы delete_message', () => {
    const nodes = [
      { id: 'del1', type: 'delete_message', position: { x: 0, y: 0 }, data: { messageIdSource: 'current_message' } },
      { id: 'msg1', type: 'message', position: { x: 0, y: 0 }, data: {} },
    ] as Node[];
    const entries = collectDeleteMessageEntries(nodes);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('del1');
  });

  it('фильтрует null узлы', () => {
    const nodes = [
      null,
      { id: 'del1', type: 'delete_message', position: { x: 0, y: 0 }, data: { messageIdSource: 'last_n', lastNCount: '10' } },
    ] as any[];
    const entries = collectDeleteMessageEntries(nodes);
    expect(entries).toHaveLength(1);
    expect(entries[0].lastNCount).toBe('10');
  });
});

// ─── generateDeleteMessageHandlers() ────────────────────────────────────────

describe('generateDeleteMessageHandlers()', () => {
  it('пустые узлы → пустая строка', () => {
    expect(generateDeleteMessageHandlers([])).toBe('');
  });

  it('узлы без delete_message → пустая строка', () => {
    const nodes = [
      { id: 'msg1', type: 'message', position: { x: 0, y: 0 }, data: {} },
    ] as Node[];
    expect(generateDeleteMessageHandlers(nodes)).toBe('');
  });

  it('генерирует код из узлов', () => {
    const nodes = [
      { id: 'del1', type: 'delete_message', position: { x: 0, y: 0 }, data: { messageIdSource: 'current_message', ignoreErrors: true } },
    ] as Node[];
    const r = generateDeleteMessageHandlers(nodes);
    expect(r).toContain('handle_callback_del1');
    expect(r).toContain('bot.delete_message');
  });
});

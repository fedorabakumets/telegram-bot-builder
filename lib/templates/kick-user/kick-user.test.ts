/**
 * @fileoverview Тест шаблона kick_user
 * Проверяет генерацию Python-кода для исключения пользователя из чата
 */

import { describe, it, expect } from 'vitest';
import {
  generateKickUser,
  generateKickUserHandlers,
  collectKickUserEntries,
} from './kick-user.renderer';
import {
  fixtureKickUserEmpty,
  fixtureKickUserCurrentUser,
  fixtureKickUserReplyUser,
  fixtureKickUserCustom,
} from './kick-user.fixture';
import { kickUserParamsSchema } from './kick-user.schema';
import type { Node } from '@shared/schema';

// ─── Zod schema validation ──────────────────────────────────────────────────

describe('kickUserParamsSchema', () => {
  it('валидирует пустой массив entries', () => {
    const result = kickUserParamsSchema.safeParse(fixtureKickUserEmpty);
    expect(result.success).toBe(true);
  });

  it('валидирует корректный entry', () => {
    const result = kickUserParamsSchema.safeParse(fixtureKickUserCurrentUser);
    expect(result.success).toBe(true);
  });

  it('отклоняет entry без nodeId', () => {
    const result = kickUserParamsSchema.safeParse({
      entries: [{ nodeId: '', safeName: 'x', userIdSource: 'current_user' }],
    });
    expect(result.success).toBe(false);
  });
});

// ─── generateKickUser() ─────────────────────────────────────────────────────

describe('generateKickUser()', () => {
  it('пустые entries → пустая строка', () => {
    expect(generateKickUser(fixtureKickUserEmpty)).toBe('');
  });

  it('current_user: генерирует unban_chat_member с only_if_banned=False', () => {
    const r = generateKickUser(fixtureKickUserCurrentUser);
    expect(r).toContain('bot.unban_chat_member');
    expect(r).toContain('only_if_banned=False');
    expect(r).toContain('kick_current_1');
  });

  it('current_user: генерирует автопереход', () => {
    const r = generateKickUser(fixtureKickUserCurrentUser);
    expect(r).toContain('handle_callback_next_node_1');
  });

  it('reply_user: использует reply_to_message', () => {
    const r = generateKickUser(fixtureKickUserReplyUser);
    expect(r).toContain('reply_to_message');
    expect(r).toContain('from_user.id');
  });

  it('custom: подставляет переменную user_id и chat_id', () => {
    const r = generateKickUser(fixtureKickUserCustom);
    expect(r).toContain('replace_variables_in_text');
    expect(r).toContain('target_user_id');
    expect(r).toContain('-1001234567890');
  });

  it('ignoreErrors=true: есть try/except', () => {
    const r = generateKickUser(fixtureKickUserCurrentUser);
    expect(r).toContain('try:');
    expect(r).toContain('except Exception');
  });

  it('ignoreErrors=false: нет внешнего try/except', () => {
    const r = generateKickUser(fixtureKickUserCustom);
    // ignoreErrors=false — не должно быть logging.error для ошибок кика
    expect(r).not.toContain('logging.error(f"Ошибка в kick_user kick_custom_1');
  });
});

// ─── collectKickUserEntries() ───────────────────────────────────────────────

describe('collectKickUserEntries()', () => {
  it('пустой массив → пустой результат', () => {
    expect(collectKickUserEntries([])).toEqual([]);
  });

  it('находит узлы kick_user', () => {
    const nodes = [
      { id: 'kick1', type: 'kick_user', position: { x: 0, y: 0 }, data: { userIdSource: 'current_user' } },
      { id: 'msg1', type: 'message', position: { x: 0, y: 0 }, data: {} },
    ] as Node[];
    const entries = collectKickUserEntries(nodes);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('kick1');
  });

  it('фильтрует null узлы', () => {
    const nodes = [
      null,
      { id: 'kick1', type: 'kick_user', position: { x: 0, y: 0 }, data: { userIdSource: 'reply_user' } },
    ] as any[];
    const entries = collectKickUserEntries(nodes);
    expect(entries).toHaveLength(1);
    expect(entries[0].userIdSource).toBe('reply_user');
  });

  it('устанавливает дефолтные значения', () => {
    const nodes = [
      { id: 'kick1', type: 'kick_user', position: { x: 0, y: 0 }, data: {} },
    ] as Node[];
    const entries = collectKickUserEntries(nodes);
    expect(entries[0].userIdSource).toBe('current_user');
    expect(entries[0].chatIdSource).toBe('current_chat');
    expect(entries[0].ignoreErrors).toBe(true);
  });
});

// ─── generateKickUserHandlers() ─────────────────────────────────────────────

describe('generateKickUserHandlers()', () => {
  it('пустые узлы → пустая строка', () => {
    expect(generateKickUserHandlers([])).toBe('');
  });

  it('узлы без kick_user → пустая строка', () => {
    const nodes = [
      { id: 'msg1', type: 'message', position: { x: 0, y: 0 }, data: {} },
    ] as Node[];
    expect(generateKickUserHandlers(nodes)).toBe('');
  });

  it('генерирует код из узлов', () => {
    const nodes = [
      { id: 'kick1', type: 'kick_user', position: { x: 0, y: 0 }, data: { userIdSource: 'current_user', ignoreErrors: true } },
    ] as Node[];
    const r = generateKickUserHandlers(nodes);
    expect(r).toContain('handle_callback_kick1');
    expect(r).toContain('bot.unban_chat_member');
    expect(r).toContain('only_if_banned=False');
  });

  it('генерирует несколько обработчиков', () => {
    const nodes = [
      { id: 'kick1', type: 'kick_user', position: { x: 0, y: 0 }, data: { userIdSource: 'current_user' } },
      { id: 'kick2', type: 'kick_user', position: { x: 0, y: 0 }, data: { userIdSource: 'reply_user' } },
    ] as Node[];
    const r = generateKickUserHandlers(nodes);
    expect(r).toContain('handle_callback_kick1');
    expect(r).toContain('handle_callback_kick2');
  });
});

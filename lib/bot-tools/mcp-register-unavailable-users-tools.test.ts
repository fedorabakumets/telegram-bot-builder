/** @fileoverview Проверка регистрации списка недоступных людей. */
import { describe, expect, it, vi } from 'vitest';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerUnavailableUsersTools } from './mcp-register-unavailable-users-tools.ts';

describe('регистрация недоступных', () => {
  /** Проверяет имя, обязательного бота и границы страницы. */
  it('требует бота и ограничивает страницу', () => {
    const registerTool = vi.fn();
    registerUnavailableUsersTools({ registerTool } as unknown as McpServer);
    const [name, config] = registerTool.mock.calls[0];
    expect(name).toBe('db_list_unavailable_users');
    expect(config.inputSchema.token_id.safeParse(undefined).success).toBe(false);
    expect(config.inputSchema.kind.safeParse('deleted').success).toBe(true);
    expect(config.inputSchema.kind.safeParse('chats').success).toBe(false);
    expect(config.inputSchema.limit.safeParse(51).success).toBe(false);
    expect(config.inputSchema.offset.safeParse(-1).success).toBe(false);
    expect(config.annotations.readOnlyHint).toBe(true);
  });
});

/** @fileoverview Проверка регистрации чтения логов и ограничения файлового экспорта транспортом stdio. */
import { describe, expect, it, vi } from 'vitest';
import { registerBotLogTools } from './mcp-register-log-tools.ts';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('registerBotLogTools', () => {
  it('на HTTP регистрирует только инструменты чтения', () => {
    const registerTool = vi.fn();
    registerBotLogTools({ registerTool } as unknown as McpServer);
    expect(registerTool.mock.calls.map(call => call[0])).toEqual(['db_list_bot_launches', 'db_get_launch_logs', 'db_search_bot_logs']);
  });
  it('на stdio разрешает экспорт и валидирует границы схемы', () => {
    const registerTool = vi.fn();
    registerBotLogTools({ registerTool } as unknown as McpServer, true);
    expect(registerTool.mock.calls.map(call => call[0])).toContain('db_export_bot_logs');
    const schema = registerTool.mock.calls[1][1].inputSchema;
    expect(schema.limit.safeParse(501).success).toBe(false);
    expect(schema.launch_id.safeParse(-1).success).toBe(false);
    expect(schema.before_id.safeParse(1.5).success).toBe(false);
  });
});

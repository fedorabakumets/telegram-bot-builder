/** @fileoverview Проверки доступности MCP-аналитики пользователей в обоих транспортах. */
import { describe, expect, it, vi } from 'vitest';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerMcpTools } from './mcp-register-tools.ts';

describe('регистрация аналитики пользователей', () => {
  /** Проверяет регистрацию инструментов и строгие ограничения публичной схемы. */
  it.each([false, true])('доступна при enableFileTools=%s', (enableFileTools) => {
    const registerTool = vi.fn();
    registerMcpTools({ registerTool } as unknown as McpServer, { enableFileTools });
    for (const name of ['db_get_users_summary', 'db_get_users_chart']) {
      const registration = registerTool.mock.calls.find(call => call[0] === name);
      expect(registration, name).toBeDefined();
      const schema = registration![1].inputSchema;
      expect(schema.project_id.safeParse(289).success).toBe(true);
      expect(schema.project_id.safeParse(-1).success).toBe(false);
      expect(schema.project_id.safeParse(1.5).success).toBe(false);
      expect(schema.token_id.safeParse(undefined).success).toBe(true);
      expect(schema.token_id.safeParse(0).success).toBe(false);
      for (const period of ['1h', '3h', '24h', '7d', '30d', '12w', '12m']) {
        expect(schema.period.safeParse(period).success, period).toBe(true);
      }
      expect(schema.period.safeParse('90d').success).toBe(false);
      if (name === 'db_get_users_chart') {
        expect(schema.mode.safeParse('cumulative').success).toBe(true);
        expect(schema.mode.safeParse('invalid').success).toBe(false);
        expect(schema.group_by.safeParse('source').success).toBe(true);
        expect(schema.group_by.safeParse('invalid').success).toBe(false);
      }
    }
  });
});

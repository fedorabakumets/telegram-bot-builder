/** @fileoverview Проверки регистрации и ограничений схем MCP-аналитики сообщений. */
import { describe, expect, it, vi } from 'vitest';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerMcpTools } from './mcp-register-tools.ts';

describe('регистрация аналитики сообщений', () => {
  /** Проверяет доступность обоих инструментов для stdio и удалённого транспорта. */
  it.each([false, true])('регистрирует инструменты при enableFileTools=%s', (enableFileTools) => {
    const registerTool = vi.fn();
    registerMcpTools({ registerTool } as unknown as McpServer, { enableFileTools });
    for (const name of ['db_get_messages_summary', 'db_get_messages_chart']) {
      const registration = registerTool.mock.calls.find(call => call[0] === name);
      expect(registration, name).toBeDefined();
      const schema = registration![1].inputSchema;
      expect(schema.project_id.safeParse(289).success).toBe(true);
      for (const invalid of [0, -1, 1.5]) expect(schema.project_id.safeParse(invalid).success).toBe(false);
      expect(schema.token_id.safeParse(undefined).success).toBe(true);
      expect(schema.token_id.safeParse(18).success).toBe(true);
      expect(schema.token_id.safeParse(0).success).toBe(false);
      for (const period of ['1h', '3h', '24h', '7d', '30d', '12w', '12m']) {
        expect(schema.period.safeParse(period).success, period).toBe(true);
      }
      expect(schema.period.safeParse('90d').success).toBe(false);
      if (name === 'db_get_messages_chart') {
        for (const mode of ['period', 'cumulative']) expect(schema.mode.safeParse(mode).success).toBe(true);
        for (const split of ['total', 'direction']) expect(schema.split.safeParse(split).success).toBe(true);
        expect(schema.mode.safeParse('invalid').success).toBe(false);
        expect(schema.split.safeParse('source').success).toBe(false);
      }
    }
  });
});

/** @fileoverview Проверки регистрации инструментов групп в обоих транспортах. */
import { describe, expect, it, vi } from 'vitest';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerMcpTools } from './mcp-register-tools.ts';

describe('регистрация аналитики групп', () => {
  /** Проверяет имена, обязательного бота и периоды графика. */
  it.each([false, true])('доступна при enableFileTools=%s', (enableFileTools) => {
    const registerTool = vi.fn();
    registerMcpTools({ registerTool } as unknown as McpServer, { enableFileTools });
    for (const name of ['db_get_groups_summary', 'db_get_groups_chart']) {
      const registration = registerTool.mock.calls.find(call => call[0] === name);
      expect(registration, name).toBeDefined();
      const schema = registration![1].inputSchema;
      expect(schema.project_id.safeParse(12).success).toBe(true);
      expect(schema.project_id.safeParse(0).success).toBe(false);
      expect(schema.token_id.safeParse(9).success).toBe(true);
      expect(schema.token_id.safeParse(undefined).success).toBe(false);
      expect(schema.token_id.safeParse(0).success).toBe(false);
      if (name === 'db_get_groups_chart') {
        for (const period of ['1h', '3h', '24h', '7d', '30d', '12w', '12m']) {
          expect(schema.period.safeParse(period).success, period).toBe(true);
        }
        expect(schema.period.safeParse('90d').success).toBe(false);
        expect(schema.mode.safeParse('cumulative').success).toBe(true);
        expect(schema.mode.safeParse('week').success).toBe(false);
      } else {
        expect(schema.period).toBeUndefined();
      }
    }
  });
});

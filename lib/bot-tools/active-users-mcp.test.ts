/** @fileoverview Проверки регистрации и реальных вызовов инструментов активных пользователей. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createBotcraftMcpServer, registerMcpTools } from './mcp-register-tools.ts';

afterEach(() => vi.unstubAllGlobals());
describe('Протокол активных пользователей', () => {
  it.each([false, true])('регистрирует инструменты при enableFileTools=%s', enableFileTools => {
    const registerTool = vi.fn();
    registerMcpTools({ registerTool } as unknown as McpServer, { enableFileTools });
    for (const name of ['db_get_active_users_summary', 'db_get_active_users_chart']) {
      const registration = registerTool.mock.calls.find(call => call[0] === name);
      expect(registration).toBeDefined();
      const schema = registration![1].inputSchema;
      expect(schema.project_id.safeParse(-1).success).toBe(false);
      expect(schema.token_id.safeParse(undefined).success).toBe(true);
      expect(schema.period.safeParse('12w').success).toBe(true);
      expect(schema.period.safeParse('invalid').success).toBe(false);
      expect(schema.mode).toBeUndefined();
      if (schema.split) expect(schema.split.safeParse('cohort').success).toBe(true);
    }
  });
  it('публикует уникальные итоги и безопасные ошибки через MCP SDK', async () => {
    const fetchMock = vi.fn(async () => Response.json({ activeInWindow: 1, newInWindow: 0, points: [
      { date: '2026-10-12T00:00:00Z', total: 1, newcomers: 0, returning: 1 },
    ] }));
    vi.stubGlobal('fetch', fetchMock);
    const server = createBotcraftMcpServer({ enableFileTools: false });
    const client = new Client({ name: 'active-users-test', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    try {
      await server.connect(serverTransport);
      await client.connect(clientTransport);
      expect((await client.listTools()).tools.map(tool => tool.name)).toEqual(expect.arrayContaining([
        'db_get_active_users_summary', 'db_get_active_users_chart',
      ]));
      const result = await client.callTool({ name: 'db_get_active_users_chart', arguments: { project_id: 289, split: 'cohort' } });
      expect(result.isError).not.toBe(true);
      expect(result.content).toEqual([expect.objectContaining({
        type: 'text', text: expect.stringContaining('"active_users":1'),
      })]);
      fetchMock.mockImplementation(async () => new Response('secret-data', { status: 403 }));
      const denied = await client.callTool({ name: 'db_get_active_users_summary', arguments: { project_id: 289 } });
      expect(denied.isError).toBe(true);
      expect(JSON.stringify(denied)).toContain('403');
      expect(JSON.stringify(denied)).not.toContain('secret-data');
    } finally { await client.close(); await server.close(); }
  });
});

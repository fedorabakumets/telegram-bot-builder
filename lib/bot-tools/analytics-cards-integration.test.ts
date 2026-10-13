/** @fileoverview Совместная регистрация инструментов источников, кнопок, Premium и языков. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createBotcraftMcpServer, registerMcpTools } from './mcp-register-tools.ts';

/** Ожидаемые инструменты четырёх карточек аналитики. */
const names = ['db_get_traffic_sources_summary', 'db_get_traffic_sources_chart',
  'db_get_popular_buttons', 'db_get_users_premium', 'db_get_users_languages'];

afterEach(() => vi.unstubAllGlobals());
describe('Интеграция карточек аналитики', () => {
  it.each([false, true])('публикует инструменты в обоих режимах: enableFileTools=%s', enableFileTools => {
    const registerTool = vi.fn();
    registerMcpTools({ registerTool } as unknown as McpServer, { enableFileTools });
    const registered = registerTool.mock.calls.map(call => call[0]);
    expect(registered).toEqual(expect.arrayContaining(names));
    for (const name of names) expect(registered.filter(value => value === name)).toHaveLength(1);
  });
  it('передаёт отказ доступа каждого инструмента через настоящий MCP SDK', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('secret-project-body', { status: 403 })));
    const server = createBotcraftMcpServer({ enableFileTools: false });
    const client = new Client({ name: 'analytics-cards-test', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    try {
      await server.connect(serverTransport);
      await client.connect(clientTransport);
      expect((await client.listTools()).tools.map(tool => tool.name)).toEqual(expect.arrayContaining(names));
      for (const name of names) {
        const denied = await client.callTool({ name, arguments: { project_id: 289 } });
        expect(denied.isError, name).toBe(true);
        expect(JSON.stringify(denied), name).toContain('403');
        expect(JSON.stringify(denied), name).not.toContain('secret-project-body');
      }
    } finally { await client.close(); await server.close(); }
  });
});

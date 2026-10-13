/**
 * @fileoverview Проверки регистрации и ошибок топа кнопок через протокол MCP.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { registerPopularButtonsTools } from './mcp-register-popular-buttons-tools.ts';

afterEach(() => vi.unstubAllGlobals());

describe('MCP популярных кнопок', () => {
  it('публикует ограниченный рейтинг и помечает отказ доступа ошибкой', async () => {
    const fetchMock = vi.fn(async () => Response.json([{ label: 'Меню', count: 3 }]));
    vi.stubGlobal('fetch', fetchMock);
    const server = new McpServer({ name: 'buttons-test', version: '1.0.0' });
    registerPopularButtonsTools(server);
    const client = new Client({ name: 'buttons-client', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    try {
      await server.connect(serverTransport);
      await client.connect(clientTransport);
      expect((await client.listTools()).tools.map(tool => tool.name)).toEqual(['db_get_popular_buttons']);
      const result = await client.callTool({ name: 'db_get_popular_buttons', arguments: { project_id: 289 } });
      expect(result.isError).not.toBe(true);
      expect(JSON.stringify(result)).toContain('returned_clicks');
      fetchMock.mockImplementation(async () => new Response('private-db-data', { status: 403 }));
      const denied = await client.callTool({ name: 'db_get_popular_buttons', arguments: { project_id: 289 } });
      expect(denied.isError).toBe(true);
      expect(JSON.stringify(denied)).not.toContain('private-db-data');
      expect((await client.callTool({ name: 'db_get_popular_buttons', arguments: { project_id: -1 } })).isError).toBe(true);
      expect((await client.callTool({ name: 'db_get_popular_buttons', arguments: { project_id: 289, period: 'bad' } })).isError).toBe(true);
    } finally { await client.close(); await server.close(); }
  });
});

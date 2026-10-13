/** @fileoverview Проверки схемы и вызовов языкового инструмента через MCP SDK. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { registerLanguagesTools } from './mcp-register-languages-tools.ts';

afterEach(() => vi.unstubAllGlobals());
describe('Протокол языков', () => {
  it('ограничивает идентификаторы и не обещает периода', () => {
    const registerTool = vi.fn();
    registerLanguagesTools({ registerTool } as unknown as McpServer);
    const [name, definition] = registerTool.mock.calls[0];
    expect(name).toBe('db_get_users_languages');
    expect(definition.inputSchema.period).toBeUndefined();
    for (const invalid of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
      expect(definition.inputSchema.project_id.safeParse(invalid).success).toBe(false);
      expect(definition.inputSchema.token_id.safeParse(invalid).success).toBe(false);
    }
    expect(definition.inputSchema.token_id.safeParse(undefined).success).toBe(true);
  });
  it('читает SQL-числа и помечает безопасный отказ доступа через SDK', async () => {
    const fetchMock = vi.fn(async () => Response.json({ languages: [{ code: 'ru', count: '7', percentage: '100.0' }] }));
    vi.stubGlobal('fetch', fetchMock);
    const server = new McpServer({ name: 'languages-test', version: '1.0.0' });
    registerLanguagesTools(server);
    const client = new Client({ name: 'languages-client', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    try {
      await server.connect(serverTransport);
      await client.connect(clientTransport);
      expect((await client.listTools()).tools[0].name).toBe('db_get_users_languages');
      const result = await client.callTool({ name: 'db_get_users_languages', arguments: { project_id: 289 } });
      expect(result.isError).not.toBe(true);
      expect(JSON.stringify(result)).toContain('returned_users');
      fetchMock.mockImplementation(async () => new Response('private-body', { status: 403 }));
      const error = await client.callTool({ name: 'db_get_users_languages', arguments: { project_id: 289 } });
      expect(error.isError).toBe(true);
      expect(JSON.stringify(error)).toContain('403');
      expect(JSON.stringify(error)).not.toContain('private-body');
    } finally { await client.close(); await server.close(); }
  });
});

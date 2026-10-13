/** @fileoverview Проверки регистрации и вызова Premium через настоящий MCP SDK. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerPremiumTools } from './mcp-register-premium-tools.ts';

afterEach(() => vi.unstubAllGlobals());
describe('Протокол Premium', () => {
  it('регистрирует только снимок с ограниченными идентификаторами', () => {
    const registerTool = vi.fn();
    registerPremiumTools({ registerTool } as unknown as McpServer);
    const [name, config] = registerTool.mock.calls[0];
    expect(name).toBe('db_get_users_premium');
    expect(config.inputSchema.project_id.safeParse(Number.MAX_SAFE_INTEGER + 1).success).toBe(false);
    expect(config.inputSchema.token_id.safeParse(undefined).success).toBe(true);
    expect(config.inputSchema.period).toBeUndefined();
  });
  it('публикует кольцевые данные и isError при отказе API', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => Response.json({ totalUsers: 10, premiumUsers: 3 }));
    vi.stubGlobal('fetch', fetchMock);
    const server = new McpServer({ name: 'premium-test', version: '1.0.0' });
    registerPremiumTools(server);
    const client = new Client({ name: 'premium-client', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    try {
      await server.connect(serverTransport);
      await client.connect(clientTransport);
      const result = await client.callTool({ name: 'db_get_users_premium', arguments: { project_id: 289 } });
      expect(result.isError).not.toBe(true);
      expect(JSON.stringify(result)).toContain('premium_users');
      fetchMock.mockImplementation(async () => new Response('internal-secret', { status: 403 }));
      const denied = await client.callTool({ name: 'db_get_users_premium', arguments: { project_id: 289 } });
      expect(denied.isError).toBe(true);
      expect(JSON.stringify(denied)).toContain('403');
      expect(JSON.stringify(denied)).not.toContain('internal-secret');
    } finally { await client.close(); await server.close(); }
  });
});


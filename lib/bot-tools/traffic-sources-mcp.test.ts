/** @fileoverview Проверки схем и реальных MCP-вызовов источников трафика через SDK. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { registerTrafficSourcesTools } from './mcp-register-traffic-sources-tools.ts';

afterEach(() => vi.unstubAllGlobals());
describe('MCP источников трафика', () => {
  it('разрешает all только сводке и ограничивает число источников', () => {
    const registerTool = vi.fn();
    registerTrafficSourcesTools({ registerTool } as unknown as McpServer);
    const summary = registerTool.mock.calls.find(call => call[0] === 'db_get_traffic_sources_summary')![1].inputSchema;
    const chart = registerTool.mock.calls.find(call => call[0] === 'db_get_traffic_sources_chart')![1].inputSchema;
    expect(summary.period.safeParse('all').success).toBe(true);
    expect(chart.period.safeParse('all').success).toBe(false);
    expect(chart.top_limit.safeParse(21).success).toBe(false);
    expect(chart.project_id.safeParse(-1).success).toBe(false);
    expect(chart.token_id.safeParse(undefined).success).toBe(true);
  });
  it('публикует сводку, динамику и безопасные ошибки через протокол', async () => {
    const fetchMock = vi.fn(async () => Response.json([{ date: '2026-10-12T00:00:00Z', sources: { direct: 2 } }]));
    vi.stubGlobal('fetch', fetchMock);
    const server = new McpServer({ name: 'traffic-test', version: '1.0.0' });
    registerTrafficSourcesTools(server);
    const client = new Client({ name: 'traffic-test', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    try {
      await server.connect(serverTransport);
      await client.connect(clientTransport);
      expect((await client.listTools()).tools.map(tool => tool.name)).toEqual([
        'db_get_traffic_sources_summary', 'db_get_traffic_sources_chart',
      ]);
      for (const name of ['db_get_traffic_sources_summary', 'db_get_traffic_sources_chart']) {
        const result = await client.callTool({ name, arguments: { project_id: 289 } });
        expect(result.isError).not.toBe(true);
        expect(JSON.stringify(result.content)).toContain('total_users');
      }
      fetchMock.mockImplementation(async () => new Response('secret', { status: 403 }));
      const denied = await client.callTool({ name: 'db_get_traffic_sources_summary', arguments: { project_id: 289 } });
      expect(denied.isError).toBe(true);
      expect(JSON.stringify(denied)).toContain('403');
      expect(JSON.stringify(denied)).not.toContain('secret');
    } finally { await client.close(); await server.close(); }
  });
});

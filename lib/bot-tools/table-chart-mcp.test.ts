/** @fileoverview График таблицы через клиент MCP и скрытие тела ошибки. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createBotcraftMcpServer } from './mcp-register-tools.ts';

afterEach(() => vi.unstubAllGlobals());

describe('MCP графика таблицы', () => {
  it('отдаёт группы, рекомендацию и безопасный отказ', async () => {
    const payload = { project_id: 7, table_id: 1, points: [{ label: 'Фото', value: 2 }], warnings: [], y_is_numeric: false, aggregation: 'count' };
    const fetchMock = vi.fn(async (input: string) => Response.json(String(input).includes('recommendations')
      ? { reason: 'Для групп подходит «type».', columns: [{ id: 2, name: 'type', isNumeric: false }] }
      : payload));
    vi.stubGlobal('fetch', fetchMock);
    const server = createBotcraftMcpServer({ enableFileTools: false });
    const client = new Client({ name: 'table-chart-test', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    try {
      await server.connect(serverTransport);
      await client.connect(clientTransport);
      expect((await client.listTools()).tools.map(tool => tool.name)).toEqual(expect.arrayContaining(['db_get_table_chart', 'db_suggest_table_chart']));
      const chart = await client.callTool({ name: 'db_get_table_chart', arguments: { project_id: 7, table_id: 1, x_column_id: 2, y_column_id: 3, aggregation: 'count' } });
      expect(chart.isError).not.toBe(true);
      expect(JSON.stringify(chart)).toContain('Фото');
      expect(String(fetchMock.mock.calls[0][0])).toContain('/tables/1/chart?');
      const suggestion = await client.callTool({ name: 'db_suggest_table_chart', arguments: { project_id: 7, table_id: 1 } });
      expect(JSON.stringify(suggestion)).toContain('type');
      fetchMock.mockImplementation(async () => new Response('secret-table', { status: 403 }));
      const denied = await client.callTool({ name: 'db_get_table_chart', arguments: { project_id: 7, table_id: 1, x_column_id: 2, y_column_id: 3 } });
      expect(denied.isError).toBe(true);
      expect(JSON.stringify(denied)).toContain('403');
      expect(JSON.stringify(denied)).not.toContain('secret-table');
    } finally { await client.close(); await server.close(); }
  });
});

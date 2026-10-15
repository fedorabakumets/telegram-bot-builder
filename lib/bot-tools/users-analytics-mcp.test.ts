/** @fileoverview Проверка аналитики через настоящий MCP-клиент и транспорт в памяти. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createBotcraftMcpServer } from './mcp-register-tools.ts';

/** Текстовый блок ответа клиента MCP. */
interface TextBlock {
  /** Вид содержимого ответа. */
  type: string;
  /** JSON-строка результата при текстовом виде ответа. */
  text?: string;
}

afterEach(() => vi.unstubAllGlobals());

describe('протокол MCP аналитики', () => {
  /** Проверяет обнаружение инструментов, успешный вызов и признак отказа в доступе. */
  it('публикует инструменты и передаёт результат и ошибку клиенту', async () => {
    const fetchMock = vi.fn(async (input: string) => Response.json(input.includes('/stats')
      ? { totalUsers: 7, privateUsers: 4, groupUsers: 2, channelUsers: 0, usersInSeveralPlaces: 0, blockedBotUsers: 1, deletedUsers: 2 }
      : [{ date: '2026-10-12', count: 2 }]));
    vi.stubGlobal('fetch', fetchMock);
    const server = createBotcraftMcpServer({ enableFileTools: false });
    const client = new Client({ name: 'analytics-test', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    try {
      await server.connect(serverTransport);
      await client.connect(clientTransport);
      const tools = await client.listTools();
      expect(tools.tools.map(tool => tool.name)).toEqual(expect.arrayContaining([
        'db_get_users_summary', 'db_get_users_chart',
      ]));
      const result = await client.callTool({
        name: 'db_get_users_chart', arguments: { project_id: 289, period: '30d', mode: 'cumulative' },
      });
      expect(result.isError).not.toBe(true);
      const content = result.content as TextBlock[];
      const data = JSON.parse(content.find(item => item.type === 'text')!.text!);
      expect(data).toMatchObject({ total_users: 7, initial_users: 5, points: [{ date: '2026-10-12', count: 7 }] });
      expect(data).not.toHaveProperty('private_users');
      const summary = await client.callTool({ name: 'db_get_users_summary', arguments: { project_id: 289 } });
      expect(summary.isError).not.toBe(true);
      const summaryBody = JSON.parse((summary.content as TextBlock[]).find(item => item.type === 'text')!.text!);
      expect(summaryBody).toMatchObject({ private_users: 4, blocked_bot_users: 1, deleted_users: 2 });
      expect(summaryBody.places_description).toContain('не число чатов');
      fetchMock.mockImplementation(async () => new Response('secret-access-data', { status: 403 }));
      const denied = await client.callTool({ name: 'db_get_users_summary', arguments: { project_id: 289 } });
      expect(denied.isError).toBe(true);
      expect(JSON.stringify(denied)).toContain('403');
      expect(JSON.stringify(denied)).not.toContain('secret-access-data');
    } finally {
      await client.close();
      await server.close();
    }
  });
});

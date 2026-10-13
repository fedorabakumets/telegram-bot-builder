/** @fileoverview Проверка аналитики сообщений настоящим MCP-клиентом через транспорт в памяти. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createBotcraftMcpServer } from './mcp-register-tools.ts';

/** Текстовый блок результата вызова MCP. */
interface TextBlock {
  /** Вид содержимого. */
  type: string;
  /** JSON-строка полезной нагрузки. */
  text?: string;
}

afterEach(() => vi.unstubAllGlobals());

describe('протокол MCP аналитики сообщений', () => {
  /** Проверяет обнаружение инструментов и безопасную передачу отказа доступа клиенту. */
  it('публикует оба инструмента и выставляет isError для HTTP 403', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('secret-project-data', { status: 403 })));
    const server = createBotcraftMcpServer({ enableFileTools: false });
    const client = new Client({ name: 'messages-analytics-test', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    try {
      await server.connect(serverTransport);
      await client.connect(clientTransport);
      expect((await client.listTools()).tools.map(tool => tool.name)).toEqual(expect.arrayContaining([
        'db_get_messages_summary', 'db_get_messages_chart',
      ]));
      for (const name of ['db_get_messages_summary', 'db_get_messages_chart']) {
        const denied = await client.callTool({ name, arguments: { project_id: 289 } });
        expect(denied.isError).toBe(true);
        const content = denied.content as TextBlock[];
        expect(JSON.parse(content.find(item => item.type === 'text')!.text!)).toHaveProperty('error');
        expect(JSON.stringify(denied)).toContain('403');
        expect(JSON.stringify(denied)).not.toContain('secret-project-data');
      }
    } finally {
      await client.close();
      await server.close();
    }
  });
  /** Проверяет передачу периода, фильтра и накопительного результата через настоящий SDK. */
  it('возвращает накопленные направления при успешном вызове', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: string) => {
      const url = new URL(input);
      expect(url.searchParams.get('tokenId')).toBe('18');
      if (url.pathname.endsWith('/stats')) return Response.json({ totalUsers: 7, totalInteractions: 701 });
      expect(url.searchParams.get('granularity')).toBe('1d');
      expect(url.searchParams.get('split')).toBe('true');
      return Response.json([
        { date: '2026-10-11T00:00:00.000Z', incoming: 2, outgoing: 1 },
        { date: '2026-10-12T00:00:00.000Z', incoming: 0, outgoing: 3 },
      ]);
    }));
    const server = createBotcraftMcpServer({ enableFileTools: false });
    const client = new Client({ name: 'messages-success-test', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    try {
      await server.connect(serverTransport);
      await client.connect(clientTransport);
      const result = await client.callTool({ name: 'db_get_messages_chart', arguments: {
        project_id: 289, token_id: 18, period: '30d', mode: 'cumulative', split: 'direction',
      } });
      expect(result.isError).not.toBe(true);
      const content = result.content as TextBlock[];
      expect(JSON.parse(content.find(item => item.type === 'text')!.text!)).toMatchObject({
        total_messages: 701, period_messages: 6, accumulation_scope: 'selected_period', points: [
          { date: '2026-10-11T00:00:00.000Z', incoming: 2, outgoing: 1 },
          { date: '2026-10-12T00:00:00.000Z', incoming: 2, outgoing: 4 },
        ],
      });
    } finally {
      await client.close();
      await server.close();
    }
  });
});

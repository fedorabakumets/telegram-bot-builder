/**
 * @fileoverview Протокол MCP таблиц: подтверждение, безопасные ошибки, файлы только локально
 * @module lib/bot-tools/bot-tables-mcp.test
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createBotcraftMcpServer } from './mcp-register-tools.ts';

const fetchMock = vi.fn();

vi.mock('./api-fetch.ts', () => ({
  apiFetch: (...args: unknown[]) => fetchMock(...args),
  resolveMcpAgentToken: () => undefined,
}));

/**
 * Поднимает пару клиент-сервер в памяти
 * @param enableFileTools - Включать ли файлы
 * @returns Клиент MCP
 */
async function connect(enableFileTools: boolean): Promise<Client> {
  const server = createBotcraftMcpServer({ enableFileTools });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: 'tables-test', version: '1.0.0' });
  await client.connect(clientTransport);
  return client;
}

describe('MCP таблиц', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('не отправляет удаление без confirm и помечает ошибку', async () => {
    const client = await connect(false);
    const result = await client.callTool({
      name: 'db_delete_table',
      arguments: { project_id: 1, table_id: 2, confirm: false },
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(JSON.stringify(result.content)).toContain('confirm: true');
  });

  it('прячет тело ответа 500', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'secret-body',
      json: async () => ({ message: 'secret-body' }),
    });
    const client = await connect(false);
    const result = await client.callTool({ name: 'db_list_tables', arguments: { project_id: 1 } });
    const text = JSON.stringify(result.content);
    expect(text).toContain('HTTP 500');
    expect(text).not.toContain('secret-body');
    expect(result.isError).toBe(true);
  });

  it('не регистрирует файловые инструменты на удалённом транспорте', async () => {
    const client = await connect(false);
    const listed = await client.listTools();
    const names = listed.tools.map((tool) => tool.name);
    expect(names).toContain('db_list_tables');
    expect(names).toContain('db_apply_table_ops');
    expect(names).toContain('db_import_table_rows');
    expect(names).not.toContain('db_export_table');
    expect(names).not.toContain('db_import_table_file');
  });

  it('регистрирует файловые инструменты локально', async () => {
    const client = await connect(true);
    const listed = await client.listTools();
    const names = listed.tools.map((tool) => tool.name);
    expect(names).toEqual(expect.arrayContaining([
      'db_import_table_file', 'db_export_table', 'db_export_project_tables', 'db_import_project_tables',
    ]));
  });
});

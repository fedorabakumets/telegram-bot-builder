/**
 * @fileoverview Проверка компактного профиля через реальные клиент и сервер MCP в памяти.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { z } from 'zod';
import { createBotcraftMcpServer } from './mcp-register-tools.ts';
import { createMcpActionRegistry } from './mcp-action-registry.ts';
import { registerMcpActionTools } from './mcp-action-tools.ts';

/** Подключения, закрываемые после каждого теста. */
const connections: Array<{ client: Client; server: McpServer }> = [];

/**
 * Подключает настоящий клиент к серверу без сети.
 * @param server - Сервер с зарегистрированными инструментами.
 * @returns Клиент MCP.
 */
async function connect(server: McpServer) {
  const client = new Client({ name: 'catalog-test', version: '1' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  connections.push({ client, server });
  return client;
}

/**
 * Читает данные текстового результата инструмента.
 * @param response - Ответ MCP.
 * @returns Объект результата.
 */
function data(response: unknown): any {
  const content = (response as { content: Array<{ text: string }> }).content;
  return JSON.parse(content[0].text);
}

afterEach(async () => {
  await Promise.all(connections.splice(0).map(async ({ client, server }) => {
    await client.close();
    await server.close();
  }));
});

describe('каталог MCP', () => {
  it('сокращает tools/list до четырёх и сохраняет точные схемы полного профиля', async () => {
    const full = await connect(createBotcraftMcpServer());
    const compact = await connect(createBotcraftMcpServer({ profile: 'compact' }));
    const original = (await full.listTools()).tools;
    const reduced = (await compact.listTools()).tools;
    expect(reduced.map(tool => tool.name).sort()).toEqual(['call_action', 'describe_actions', 'list_sections', 'search_actions']);
    expect(original.length).toBeGreaterThan(100);
    const originalActions = original.filter(tool => !reduced.some(item => item.name === tool.name));
    /** Ни одно действие приложения не должно молча получать угаданную категорию или эффект. */
    for (const tool of originalActions) {
      expect(tool._meta?.botcraft).not.toMatchObject({ effect: 'unknown' });
      expect(tool._meta?.botcraft).not.toMatchObject({ section: 'unclassified' });
    }
    for (let offset = 0; offset < originalActions.length; offset += 20) {
      const batch = originalActions.slice(offset, offset + 20);
      const described = data(await compact.callTool({ name: 'describe_actions', arguments: { ids: batch.map(tool => tool.name) } })).actions;
      for (const action of described) {
        const tool = original.find(tool => tool.name === action.id);
        expect(action.inputSchema).toEqual(tool?.inputSchema);
        expect(action.outputSchema).toEqual(tool?.outputSchema);
      }
    }
    /** Метрики измерены по фактическому ответу tools/list без вызовов живых ботов. */
    console.info('MCP_PROFILE_METRICS', JSON.stringify({ fullCount: original.length, compactCount: reduced.length,
      fullBytes: Buffer.byteLength(JSON.stringify(original)), compactBytes: Buffer.byteLength(JSON.stringify(reduced)),
      actionsChecked: originalActions.length }));
    expect(JSON.stringify(reduced).length).toBeLessThan(JSON.stringify(original).length / 4);
  });

  it('сохраняет результаты локальных безопасных обработчиков в обоих профилях', async () => {
    const full = await connect(createBotcraftMcpServer());
    const compact = await connect(createBotcraftMcpServer({ profile: 'compact' }));
    const cases = [
      { name: 'list_node_types', args: {} }, { name: 'list_operators', args: {} },
      { name: 'list_commands', args: {} }, { name: 'get_node_schema', args: { type: 'message' } },
      { name: 'get_node_example', args: { type: 'condition' } },
      { name: 'create_node', args: { type: 'message', id: 'fixed', position: { x: 0, y: 0 } } },
      { name: 'validate_node', args: { type: 'message', node: {} } },
    ];
    for (const item of cases) {
      const direct = await full.callTool({ name: item.name, arguments: item.args });
      const delegated = await compact.callTool({ name: 'call_action', arguments: { action_id: item.name, args: item.args } });
      expect(delegated).toEqual(direct);
    }
    /** Целевые задачи проверяются на доступность исходных контрактов без побочных эффектов. */
    const tasks = ['db_list_projects', 'db_get_node', 'db_update_node', 'db_connect_nodes', 'db_apply_ops',
      'db_list_tables', 'db_apply_table_ops', 'db_get_analytics_v2',
      'db_bot_status', 'db_start_bot', 'db_bot_logs', 'db_list_sheets'];
    const described = data(await compact.callTool({ name: 'describe_actions', arguments: { ids: tasks } }));
    expect(described.actions.map((action: { id: string }) => action.id)).toEqual(tasks);
  });

  it('проверяет аргументы до выполнения и сохраняет отказ выключенного типа', async () => {
    const client = await connect(createBotcraftMcpServer({ profile: 'compact', disabledNodeTypes: ['message'] }));
    expect((await client.callTool({ name: 'call_action', arguments: { action_id: 'create_node', args: { type: 42 } } })).isError).toBe(true);
    const refused = data(await client.callTool({ name: 'call_action', arguments: { action_id: 'create_node', args: { type: 'message' } } }));
    expect(refused.error).toBeTruthy();
    const types = data(await client.callTool({ name: 'call_action', arguments: { action_id: 'list_node_types' } }));
    expect(JSON.stringify(types)).not.toContain('"type":"message"');
  });

  it('исключает файловые действия из поиска, схем и вызовов HTTP', async () => {
    const client = await connect(createBotcraftMcpServer({ profile: 'compact', enableFileTools: false }));
    const search = data(await client.callTool({ name: 'search_actions', arguments: { query: '', limit: 100 } }));
    expect(search.actions.map((action: { id: string }) => action.id)).not.toContain('load_project');
    for (const id of ['load_project', 'save_project', 'db_export_project']) {
      expect((await client.callTool({ name: 'describe_actions', arguments: { ids: [id] } })).isError).toBe(true);
      expect((await client.callTool({ name: 'call_action', arguments: { action_id: id, args: {} } })).isError).toBe(true);
      const found = data(await client.callTool({ name: 'search_actions', arguments: { query: id } }));
      expect(found.actions.map((action: { id: string }) => action.id)).not.toContain(id);
    }
    expect((await client.callTool({ name: 'call_action', arguments: { action_id: 'save_project', args: {} } })).isError).toBe(true);
  });

  it('ищет по русскому описанию и возвращает страницы без повторов', async () => {
    const client = await connect(createBotcraftMcpServer({ profile: 'compact' }));
    const found = data(await client.callTool({ name: 'search_actions', arguments: { query: 'латиница' } }));
    expect(found.actions.length).toBeGreaterThan(0);
    const first = data(await client.callTool({ name: 'search_actions', arguments: { limit: 2 } }));
    const second = data(await client.callTool({ name: 'search_actions', arguments: { limit: 2, cursor: first.next_cursor } }));
    expect(second.actions.some((action: { id: string }) => first.actions.some((item: { id: string }) => item.id === action.id))).toBe(false);
  });

  it('сохраняет defaults, контекст запроса и проверку outputSchema', async () => {
    const server = new McpServer({ name: 'fixture', version: '1' });
    const registry = createMcpActionRegistry(server);
    registry.facade.registerTool('fixture', {
      inputSchema: { value: z.number().default(7) }, outputSchema: { value: z.number(), hasSignal: z.boolean() },
    }, async ({ value }, extra) => ({ content: [], structuredContent: { value, hasSignal: !!extra.signal } }));
    registry.facade.registerTool('bad_output', { outputSchema: { value: z.number() } }, async () => ({ content: [], structuredContent: { value: 'wrong' } }));
    registerMcpActionTools(server, registry.actions, 'compact');
    const client = await connect(server);
    const response = await client.callTool({ name: 'call_action', arguments: { action_id: 'fixture', args: {} } });
    expect(response.structuredContent).toEqual({ value: 7, hasSignal: true });
    expect((await client.callTool({ name: 'call_action', arguments: { action_id: 'bad_output' } })).isError).toBe(true);
  });
});

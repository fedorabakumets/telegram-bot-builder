/** @fileoverview Сквозной изолированный путь SDK MCP → HTTP → настоящие handlers → модель сохранения и readback. */
import { createServer, type Server } from 'node:http';
import express from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

/** Только хранилище и внешние эффекты заменены изолированной моделью; это не PostgreSQL/PAT integration. */
const state = vi.hoisted(() => ({ row: {} as Record<string, any>, conflict: false,
  writes: 0, requests: 0, effects: vi.fn(), events: [] as number[] }));
vi.mock('../../server/storages/storage', () => ({ storage: {
  getBotProject: async (id: number) => id === 1 ? structuredClone(state.row) : undefined,
  isProjectArchivedForUser: async () => false,
  hasProjectAccess: async (id: number, owner: number) => id === 1 && owner === 7,
  updateBotProject: async (id: number, patch: Record<string, unknown>, revision?: number) => {
    if (state.conflict) { state.row.revision++; state.conflict = false; }
    if (id !== 1 || revision !== state.row.revision) return undefined;
    state.writes++; state.row = { ...state.row, ...structuredClone(patch), revision: state.row.revision + 1 };
    return structuredClone(state.row);
  },
} }));
vi.mock('../../server/telegram/auth-middleware', () => ({
  getOwnerIdFromRequest: (req: express.Request) => req.headers.authorization === 'Bearer isolated-owner' ? 7 : null,
}));
vi.mock('../../server/routes/projectRoutes/handlers/project-update-effects', () => ({
  runProjectUpdateEffects: async (...args: unknown[]) => {
    state.effects(...args); state.events.push(state.row.revision);
    return { liveBroadcast: 'broadcast_attempted', runtimeApply: 'not_requested' };
  },
}));
import { getProjectHandler } from '../../server/routes/projectRoutes/handlers/getProjectHandler';
import { updateProjectHandler } from '../../server/routes/projectRoutes/handlers/updateProjectHandler';
import { requireProjectAccess } from '../../server/middleware/requireProjectAccess';
import { createBotcraftMcpServer } from './mcp-register-tools';
import { scaffoldMinimalProject } from './project-mutate';

/** Ресурсы текущего теста не соединяются с рабочим приложением. */
let http: Server | undefined;
const connections: Array<{ client: Client; server: McpServer }> = [];
afterEach(async () => {
  await Promise.all(connections.splice(0).map(async ({ client, server }) => { await client.close(); await server.close(); }));
  if (http) { http.closeAllConnections(); await new Promise<void>((resolve) => http!.close(() => resolve())); http = undefined; }
  vi.unstubAllEnvs(); vi.clearAllMocks();
});

/**
 * Поднимает только два настоящих маршрута на случайном loopback-порту.
 * @returns URL изолированного HTTP-сервера
 */
async function startFixture(): Promise<string> {
  const app = express(); app.use(express.json());
  app.use((_req, _res, next) => { state.requests++; next(); });
  app.get('/api/projects/:id', requireProjectAccess, getProjectHandler);
  app.put('/api/projects/:id', requireProjectAccess, updateProjectHandler);
  http = createServer(app);
  await new Promise<void>((resolve) => http!.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${(http.address() as { port: number }).port}`;
}

/** Подключает реальный SDK к выбранному профилю через транспорт в памяти. */
async function connect(profile: 'full' | 'compact'): Promise<Client> {
  const server = createBotcraftMcpServer({ profile, enableFileTools: false });
  const client = new Client({ name: 'workflow-test', version: '1' });
  const [left, right] = InMemoryTransport.createLinkedPair();
  await Promise.all([client.connect(left), server.connect(right)]);
  connections.push({ client, server }); return client;
}

/** Извлекает прежний JSON content для проверки совместимости. */
function payload(response: any): any { return JSON.parse(response.content[0].text); }

describe('Типовая задача редактирования через MCP', () => {
  it('оба профиля сохраняют одинаковую правку через HTTP и возвращают readback; считает discovery отдельно', async () => {
    vi.stubEnv('API_BASE_URL', await startFixture()); vi.stubEnv('MCP_AGENT_TOKEN', 'isolated-owner');
    const seed = scaffoldMinimalProject().project;
    const nodeId = seed.sheets[0].nodes.find(node => node.type === 'message')!.id;
    const results: unknown[] = [];
    for (const profile of ['full', 'compact'] as const) {
      state.row = { id: 1, name: 'Изолированный', ownerId: 7, revision: 5, data: structuredClone(seed) };
      state.writes = 0; state.requests = 0; state.events = [];
      const client = await connect(profile); let discovery = 0; let calls = 0;
      if (profile === 'compact') {
        expect(payload(await client.callTool({ name: 'list_sections', arguments: {} })).sections.length).toBeGreaterThan(0); discovery++;
        const found = payload(await client.callTool({ name: 'search_actions', arguments: { query: 'db_update_node' } })); discovery++;
        expect(found.actions.map((item: any) => item.id)).toContain('db_update_node');
        const described = payload(await client.callTool({ name: 'describe_actions', arguments: { ids: ['db_update_node', 'get_project_db'] } })); discovery++;
        expect(described.actions).toHaveLength(2);
      }
      /** В обоих профилях выполняются те же исходные обработчики и аргументы. */
      const invoke = async (name: string, args: Record<string, unknown>) => {
        calls++;
        return client.callTool(profile === 'compact'
          ? { name: 'call_action', arguments: { action_id: name, args } } : { name, arguments: args });
      };
      const saved = await invoke('db_update_node', { project_id: 1, node_id: nodeId, patch: { data: { messageText: 'Проверено через HTTP' } } });
      expect(saved.isError).not.toBe(true);
      expect(saved._meta?.botcraft).toMatchObject({ outcome: 'saved', persistence: { confirmed: true, revision: 6 } });
      const readback = payload(await invoke('get_project_db', { project_id: 1 }));
      expect(readback.revision).toBe(6);
      expect(readback.data.sheets[0].nodes.find((node: any) => node.id === nodeId).data.messageText).toBe('Проверено через HTTP');
      expect(state.writes).toBe(1); expect(state.events).toEqual([6]); expect(state.requests).toBe(3);
      results.push(readback);
      console.info('MCP_WORKFLOW_METRICS', JSON.stringify({ task: 'update_node_and_readback', profile,
        discoveryCalls: discovery, executionCalls: calls, httpRequests: state.requests, writes: state.writes }));
      const before = state.writes;
      const denied = await invoke('db_update_node', { project_id: 2, node_id: nodeId, patch: { data: { messageText: 'Чужой' } } });
      expect(denied.isError).toBe(true); expect(state.writes).toBe(before);
      state.conflict = true;
      const conflict = await invoke('db_update_node', { project_id: 1, node_id: nodeId, patch: { data: { messageText: 'Конфликт' } } });
      expect(conflict.isError).toBe(true); expect(payload(conflict).status).toBe(409);
      expect(state.writes).toBe(before);
      expect(state.row.data.sheets[0].nodes.find((node: any) => node.id === nodeId).data.messageText).toBe('Проверено через HTTP');
    }
    expect(results[0]).toEqual(results[1]);
  }, 30_000);
});

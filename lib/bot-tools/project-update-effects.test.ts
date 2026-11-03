/**
 * @fileoverview Проверяет независимость сопутствующих действий после сохранения сценария.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ sync: vi.fn(), version: vi.fn(), latest: vi.fn(), prune: vi.fn(), broadcast: vi.fn(), restart: vi.fn() }));
vi.mock('../../server/storages/storage', () => ({ storage: { createProjectVersion: mocks.version, getLatestProjectVersion: mocks.latest, pruneProjectVersions: mocks.prune } }));
vi.mock('../../server/services/content-table', () => ({ syncContentToTable: mocks.sync }));
vi.mock('../../server/bots/restartAllRunningBots', () => ({ restartAllRunningBots: mocks.restart }));
vi.mock('../../server/telegram/auth-middleware', () => ({ getOwnerIdFromRequest: () => 1 }));
vi.mock('../../server/canvas/broadcastAgentCanvasUpdate', () => ({ broadcastAgentCanvasUpdate: mocks.broadcast }));
vi.mock('../../server/canvas/parse-agent-canvas-data', () => ({ parseAgentCanvasData: (data: unknown) => ({ data }) }));
vi.mock('../../server/terminal/broadcastProjectsChanged', () => ({ broadcastProjectsChangedToUsers: vi.fn() }));
vi.mock('../../server/terminal/resolveProjectMembers', () => ({ getProjectMemberIds: async () => [] }));
vi.mock('../../server/redis/redisClient', () => ({ getRedisPublisher: () => null }));
import { runProjectUpdateEffects } from '../../server/routes/projectRoutes/handlers/project-update-effects';
describe('эффекты сохранённого проекта', () => {
 beforeEach(() => { vi.clearAllMocks(); mocks.sync.mockResolvedValue(undefined); mocks.version.mockResolvedValue({ id: 9 }); mocks.latest.mockResolvedValue(null); mocks.restart.mockResolvedValue({ ok: true, failed: 0 }); });
 it('не выдаёт dispatch за применение клиентом и не теряет broadcast при отказе истории', async () => {
  mocks.version.mockRejectedValue(new Error('version unavailable'));
  const effects = await runProjectUpdateEffects({ body: { agentEdit: true } } as never, { id: 1 } as never, { data: {} }, 'Версия');
  expect(effects).toMatchObject({ version: 'failed', liveBroadcast: 'broadcast_attempted' }); expect(mocks.broadcast).toHaveBeenCalledTimes(1);
 });
 it('фиксирует независимые от commit отказы контента и restart', async () => {
  mocks.sync.mockRejectedValue(new Error('content unavailable')); mocks.restart.mockRejectedValue(new Error('runtime unavailable'));
  const effects = await runProjectUpdateEffects({ body: {} } as never, { id: 1 } as never, { data: {}, restartOnUpdate: true }, '');
  expect(effects).toMatchObject({ contentSync: 'failed', version: 'created_or_unchanged', runtimeApply: 'failed' });
 });
});

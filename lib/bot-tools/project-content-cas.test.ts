/**
 * @fileoverview Проверяет clone и CAS обратной синхронизации таблицы контента.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ getBotProject: vi.fn(), updateBotProject: vi.fn(), getBotTableColumns: vi.fn() }));
vi.mock('../../server/storages/storage', () => ({ storage: mocks }));
import { syncTableToScenario } from '../../server/services/content-table/sync-table-to-scenario';
describe('CAS синхронизации контента', () => {
 beforeEach(() => { vi.clearAllMocks(); mocks.getBotTableColumns.mockResolvedValue([]); });
 it('не меняет cached исходник и при конфликте повторяет на новом snapshot', async () => {
  const original = { revision: 3, data: { sheets: [{ nodes: [{ id: 'm', data: { messageText: 'до' } }] }] } };
  const newer = structuredClone(original); newer.revision = 4;
  mocks.getBotProject.mockResolvedValueOnce(original).mockResolvedValueOnce(newer);
  mocks.updateBotProject.mockResolvedValueOnce(undefined).mockResolvedValueOnce({ revision: 5 });
  await syncTableToScenario(1, 2, { key: 'm', type: 'message', value: 'после' });
  expect(original.data.sheets[0].nodes[0].data.messageText).toBe('до');
  expect(mocks.updateBotProject.mock.calls.map((call) => call[2])).toEqual([3, 4]);
 });
});

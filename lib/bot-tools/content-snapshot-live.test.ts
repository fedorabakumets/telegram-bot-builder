/** @fileoverview Live-снимок контента содержит прочитанную сохранённую ревизию, а не данные запроса. */
import { describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ read: vi.fn(), broadcast: vi.fn() }));
vi.mock('../../server/storages/storage', () => ({ storage: { getBotProject: mocks.read } }));
vi.mock('../../server/canvas/broadcastAgentCanvasUpdate', () => ({ broadcastAgentCanvasUpdate: mocks.broadcast }));
import { broadcastContentSnapshot } from '../../server/routes/tables/broadcast-content-snapshot';

describe('Сохранённый контент на холсте', () => {
  it('передаёт текущий снимок и ревизию, отсутствие строки ничего не рассылает', async () => {
    const data = { sheets: [{ id: 's', name: 'Лист', nodes: [] }], activeSheetId: 's' };
    mocks.read.mockResolvedValueOnce({ id: 7, data, revision: 12 });
    await broadcastContentSnapshot(7);
    expect(mocks.broadcast).toHaveBeenCalledWith(7, expect.objectContaining({ data }),
      expect.objectContaining({ revision: 12 }));
    mocks.read.mockResolvedValueOnce(undefined);
    await broadcastContentSnapshot(7);
    expect(mocks.broadcast).toHaveBeenCalledOnce();
  });
});

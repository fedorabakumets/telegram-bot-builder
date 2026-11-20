/** @fileoverview Проверка разделения сохранённого доступа к одному чату у разных ботов. */
import { beforeEach, expect, it, vi } from 'vitest';

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('../../database/db', () => ({ pool: { query } }));
import { enrichDialogAccess } from './access-store';

beforeEach(() => query.mockReset());

it('сохраняет разные результаты одного чата в общей области ботов', async () => {
  query.mockResolvedValue({ rows: [
    { token_id: 7, chat_id: '15', status: 'available', checked_at: '2026-11-17' },
    { token_id: 8, chat_id: '15', status: 'kicked', checked_at: '2026-11-16' },
  ] });
  const result = await enrichDialogAccess(12, null, [{ userId: '15', tokenId: 7 }, { userId: '15', tokenId: 8 }]);
  expect(result.map(entry => entry.accessStatus)).toEqual(['available', 'kicked']);
  expect(query.mock.calls[0][1]).toEqual([12, [7, 8], ['15', '15']]);
});

it('явно выбранный бот определяет область статусов', async () => {
  query.mockResolvedValue({ rows: [{ token_id: 7, chat_id: '15', status: 'available' }] });
  const result = await enrichDialogAccess(12, 7, [{ userId: '15', tokenId: 8 }]);
  expect(result[0].accessStatus).toBe('available');
  expect(query.mock.calls[0][1][1]).toEqual([7]);
});

it('не запрашивает произвольного бота для записи без его идентификатора', async () => {
  const result = await enrichDialogAccess(12, null, [{ userId: '15' }]);
  expect(query).not.toHaveBeenCalled();
  expect(result[0].accessStatus).toBe('unknown');
});

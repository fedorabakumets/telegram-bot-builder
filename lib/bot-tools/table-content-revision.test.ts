/** @fileoverview Проверка атомарного увеличения ревизии сценария при изменении контента таблицы. */
import { expect, it, vi } from 'vitest';
import { applyCellEdits } from '../../server/database/bot-tables/apply-cell-edits';
it('обновляет контент и ревизию до COMMIT одной транзакции', async () => {
  const scenario = { sheets: [{ nodes: [{ id: 'message', type: 'message', data: { messageText: 'старое' } }] }] };
  const query = vi.fn(async (sql: string, _args?: unknown[]) => {
    if (sql.startsWith('SELECT data')) return { rows: [{ data: scenario }] };
    if (sql.startsWith('SELECT name')) return { rows: [{ name: '_content' }] };
    if (sql.startsWith('SELECT id, name')) return { rows: [{ id: 1, name: 'key' }, { id: 2, name: 'type' }, { id: 3, name: 'value' }] };
    if (sql.startsWith('SELECT id, table_id')) return { rows: [{ id: 11, table_id: 9, row_index: 0, data: { '1': 'message', '2': 'message', '3': 'старое' } }] };
    return { rows: [] };
  });
  const rows = await applyCellEdits({ query } as never, 7, 9, [{ rowId: 11, columnId: '3', before: 'старое', after: 'новое' }]);
  expect(rows[0].data['3']).toBe('новое');
  const updateIndex = query.mock.calls.findIndex(([sql]) => sql.startsWith('UPDATE bot_projects'));
  expect(query.mock.calls[updateIndex][0]).toContain('revision = revision + 1');
  expect(JSON.parse(String(query.mock.calls[updateIndex][1]?.[1])).sheets[0].nodes[0].data.messageText).toBe('новое');
  expect(query.mock.calls[query.mock.calls.length - 1]?.[0]).toBe('COMMIT');
  expect(updateIndex).toBeLessThan(query.mock.calls.length - 1);
});

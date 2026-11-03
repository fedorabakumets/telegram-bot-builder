/** @fileoverview Ошибка транспорта или нечитаемый ответ после записи не доказывают отсутствие COMMIT таблиц. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tableRequest } from './bot-tables-http';
import { readTablePersistenceProof } from './table-persistence-proof';
import { tableToolResult } from './mcp-table-result';
import { normalizeMcpActionResult } from './mcp-action-result';
import { getMcpActionPolicy } from './mcp-action-policy';

afterEach(() => vi.unstubAllGlobals());
describe('Неопределённый исход записи таблицы', () => {
  it.each(['network', '500', '408', 'bad-json'])('сохраняет unknown для случая %s', async (kind) => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      if (kind === 'network') throw new Error('Соединение оборвано');
      if (kind === 'bad-json') return new Response('not-json', { status: 200 });
      return new Response('internal-details-must-not-leak', { status: Number(kind) });
    }));
    const result = await tableRequest('/api/projects/7/tables/9/rows', { method: 'POST', body: '{}' });
    expect(result).toMatchObject({ error: expect.any(String), outcome: 'unknown' });
    expect(JSON.stringify(result)).not.toContain('internal-details-must-not-leak');
    const normalized = normalizeMcpActionResult(tableToolResult(result), getMcpActionPolicy('db_add_table_rows'));
    expect(normalized.isError).toBe(true);
    expect(normalized._meta?.botcraft).toMatchObject({ outcome: 'unknown', persistence: { confirmed: false } });
  });
  it('не превращает подтверждённый отказ доступа в неизвестную запись', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('private', { status: 403 })));
    expect(await tableRequest('/api/projects/7/tables/9', { method: 'DELETE' }))
      .toEqual({ error: 'HTTP 403', status: 403 });
  });
  it('не принимает случайно оставшееся подтверждение заголовка у 202', () => {
    const response = new Response('{}', { status: 202,
      headers: { 'x-botcraft-persistence': JSON.stringify({ confirmed: true, projectId: 7, tableId: 9 }) } });
    expect(readTablePersistenceProof(response, '/api/projects/7/tables/9/rows')).toBeUndefined();
  });
});

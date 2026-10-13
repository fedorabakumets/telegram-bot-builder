/** @fileoverview Проверки поиска, курсоров и безопасного локального экспорта логов. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFile, unlink } from 'node:fs/promises';
import { searchBotLogsInDb } from './bot-log-search-db.ts';
import { exportBotLogsInDb } from './bot-log-export-db.ts';
vi.mock('./api-fetch.ts', () => ({ apiFetch: vi.fn() }));
import { apiFetch } from './api-fetch.ts';
const request = vi.mocked(apiFetch);
const period = { from: '2026-10-10T00:00:00Z', to: '2026-10-11T00:00:00Z' };
/** Создаёт строку ответа с лишним секретным полем для проверки отбора.
 * @param id - Идентификатор
 * @param content - Текст
 * @returns Строка API
 */
const row = (id: number, content = 'Ошибка') => ({ id, content, type: 'stderr', timestamp: period.from, token: 'secret' });
afterEach(() => vi.resetAllMocks());
describe('поиск и экспорт логов MCP', () => {
  it('проверяет период до HTTP запроса', async () => {
    expect(await searchBotLogsInDb(1, 2, { ...period, to: period.from })).toHaveProperty('error');
    expect(request).not.toHaveBeenCalled();
  });
  it('фильтрует строки и продолжает после последней просмотренной', async () => {
    request.mockResolvedValue(new Response(JSON.stringify([row(1), row(2, 'other'), row(3)])));
    const result = await searchBotLogsInDb(1, 2, { ...period, text: 'оши', type: 'stderr', limit: 1 });
    expect(result).toMatchObject({ count: 1, scanned: 1, nextBeforeId: 3, hasMore: true });
    if (result.logs) expect(result.logs[0]).not.toHaveProperty('token');
    expect(request.mock.calls[0][0]).toContain('/api/projects/1/tokens/2/logs?');
  });
  it('возвращает курсор даже для пустой страницы совпадений', async () => {
    request.mockResolvedValue(new Response(JSON.stringify(Array.from({ length: 1000 }, (_, i) => row(i + 1, 'other')))));
    expect(await searchBotLogsInDb(1, 2, { ...period, text: 'missing' })).toMatchObject({ count: 0, scanned: 1000, nextBeforeId: 1, hasMore: true });
  });
  it('не раскрывает тело отказа авторизации', async () => {
    request.mockResolvedValue(new Response('secret', { status: 403 }));
    expect(await searchBotLogsInDb(1, 2, period)).toEqual({ error: 'Не удалось получить логи: HTTP 403' });
  });
  it('сохраняет ограниченный JSONL и отмечает неполноту', async () => {
    request.mockResolvedValue(new Response(JSON.stringify([row(1), row(2)])));
    const result = await exportBotLogsInDb(1, 2, { ...period, maxRows: 1 });
    expect(result).toMatchObject({ count: 1, truncated: true, nextBeforeId: 2 });
    if (result.path) {
      try {
        expect(result.path).toContain('mcp-log-exports');
        const text = await readFile(result.path, 'utf8');
        expect(JSON.parse(text)).toMatchObject({ id: 2 });
        expect(text).not.toContain('secret');
      } finally { await unlink(result.path); }
    }
  });
  it('не выдаёт файл при ошибке API', async () => {
    request.mockResolvedValue(new Response('{}', { status: 403 }));
    expect(await exportBotLogsInDb(1, 2, period)).toHaveProperty('error');
  });
  it('ограничивает сканирование экспорта даже без совпадений', async () => {
    let top = 20000;
    request.mockImplementation(async () => {
      const rows = Array.from({ length: 1000 }, (_, i) => row(top - i, 'other'));
      top -= 1000;
      return new Response(JSON.stringify(rows));
    });
    const result = await exportBotLogsInDb(1, 2, { ...period, text: 'missing' });
    expect(result).toMatchObject({ count: 0, scanned: 10000, truncated: true, nextBeforeId: 10001 });
    expect(request).toHaveBeenCalledTimes(10);
    if (result.path) await unlink(result.path);
  });
});

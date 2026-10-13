/**
 * @fileoverview Проверки ограниченных страниц запусков, доступа и безопасных ответов MCP.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from './api-fetch.ts';
import { listBotLaunchesInDb, getLaunchLogsInDb } from './bot-launch-pages-db.ts';
import { parseLaunchPage } from '../../server/routes/botManagement/handlers/launch-page-query';
vi.mock('./api-fetch.ts', () => ({ apiFetch: vi.fn() }));
afterEach(() => vi.resetAllMocks());

describe('страницы запусков MCP', () => {
  it('передаёт курсор и URL, удаляет посторонние поля', async () => {
    vi.mocked(apiFetch).mockResolvedValue(Response.json([{ id: 12, status: 'running', token: 'secret' }]));
    const result = await listBotLaunchesInDb(301, { limit: 1, beforeId: 20, apiBaseUrl: 'http://test' });
    expect(apiFetch).toHaveBeenCalledWith('/api/tokens/301/launch-history?limit=1&beforeId=20', { apiBaseUrl: 'http://test' });
    expect(result).toMatchObject({ total: 1, has_more: true, next_before_id: 12, launches: [{ id: 12, status: 'running' }] });
    expect(JSON.stringify(result)).not.toContain('secret');
  });
  it('читает только выбранный запуск и вычисляет курсор старейшей строки', async () => {
    vi.mocked(apiFetch).mockResolvedValue(Response.json([{ id: 8, launchId: 7 }, { id: 9, launchId: 7 }]));
    expect(await getLaunchLogsInDb(7, { limit: 2 })).toMatchObject({ next_before_id: 8, has_more: true });
    expect(vi.mocked(apiFetch).mock.calls[0][0]).toBe('/api/launch/7/logs?limit=2');
  });
  it('пустой существующий запуск завершается без курсора', async () => {
    vi.mocked(apiFetch).mockResolvedValue(Response.json([]));
    expect(await getLaunchLogsInDb(7)).toMatchObject({ logs: [], total: 0, next_before_id: null, has_more: false });
  });
  it('не раскрывает тело отказа в доступе и сетевой ошибки', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(new Response('secret', { status: 403 }));
    expect(await getLaunchLogsInDb(7)).toEqual({ error: 'Не удалось прочитать записи: HTTP 403' });
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error('secret'));
    expect(JSON.stringify(await listBotLaunchesInDb(301))).not.toContain('secret');
  });
  it('не вызывает API при неверных идентификаторах или границах', async () => {
    for (const options of [{ limit: 501 }, { limit: 0 }, { beforeId: 0 }, { beforeId: 1.2 }]) {
      expect(await getLaunchLogsInDb(7, options)).toHaveProperty('error');
    }
    expect(await listBotLaunchesInDb(-1)).toHaveProperty('error');
    expect(apiFetch).not.toHaveBeenCalled();
  });
  it('отклоняет повреждённый ответ API', async () => {
    vi.mocked(apiFetch).mockResolvedValue(Response.json([{ id: 'not-id', token: 'secret' }]));
    expect(await getLaunchLogsInDb(7)).toEqual({ error: 'Некорректный ответ API' });
  });
});

describe('ограничения HTTP-страниц', () => {
  it('принимает корректные значения и ограничивает страницы', () => {
    expect(parseLaunchPage({}, 10, 100)).toEqual({ limit: 10, beforeId: undefined });
    expect(parseLaunchPage({ limit: '100', beforeId: '9' }, 10, 100)).toEqual({ limit: 100, beforeId: 9 });
    for (const query of [{ limit: '101' }, { limit: '1.2' }, { beforeId: '-1' }, { beforeId: ['1', '2'] }]) {
      expect(parseLaunchPage(query, 10, 100)).toHaveProperty('error');
    }
  });
});

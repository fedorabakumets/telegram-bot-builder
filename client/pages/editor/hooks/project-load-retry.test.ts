/** @fileoverview Проверка восстановления загрузки проекта после 35-секундного перезапуска сервера. */
import { afterEach, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { loadEditorProject, ProjectLoadError } from './load-editor-project';
import { retryProjectLoad, projectLoadRetryDelay } from './project-load-retry';
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
/** Настоящий механизм React Query дожидается сервера без ручной перезагрузки страницы. */
it('восстанавливает проект после паузы сервера на 35 секунд', async () => {
  vi.useFakeTimers();
  const started = Date.now();
  const request = vi.fn().mockImplementation(async () => {
    if (Date.now() - started < 35_000) throw new TypeError('Failed to fetch');
    return Response.json({ id: 12, name: 'Торлинк' });
  });
  vi.stubGlobal('fetch', request);
  const client = new QueryClient();
  const pending = client.fetchQuery({ queryKey: ['restart-project'], queryFn: () => loadEditorProject(12),
    retry: retryProjectLoad, retryDelay: projectLoadRetryDelay });
  const result = expect(pending).resolves.toEqual({ id: 12, name: 'Торлинк' });
  await vi.advanceTimersByTimeAsync(39_000);
  await result;
  expect(request.mock.calls.length).toBeGreaterThan(2);
  client.clear();
});
/** Отказ доступа и действительный 404 требуют действий пользователя, а не многократных запросов. */
it.each([400, 401, 403, 404])('не повторяет постоянную ошибку %s', status => {
  expect(retryProjectLoad(0, new ProjectLoadError(status))).toBe(false);
});
/** Длительный сбой ограничен и не создаёт бесконечную загрузку. */
it('ограничивает повторы сетевых ошибок и временных ответов', () => {
  expect(retryProjectLoad(0, new ProjectLoadError(503))).toBe(true);
  expect(retryProjectLoad(12, new TypeError('Failed to fetch'))).toBe(false);
  expect(retryProjectLoad(0, new DOMException('Отмена', 'AbortError'))).toBe(false);
  expect(projectLoadRetryDelay(10)).toBe(4000);
});

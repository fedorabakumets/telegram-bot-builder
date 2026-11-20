/** @fileoverview Проверка различения настоящего 404, сбоя сервера и истечения сессии проекта. */
import { afterEach, expect, it, vi } from 'vitest';
import { loadEditorProject, ProjectLoadError } from './load-editor-project';
afterEach(() => { vi.unstubAllGlobals(); });
/** Код ответа сохраняется вместо подмены всех ошибок отсутствием проекта. */
it.each([401, 403, 404, 500, 503])('сохраняет HTTP-код %s', async status => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status })));
  await expect(loadEditorProject(12)).rejects.toMatchObject({ status });
  await expect(loadEditorProject(12)).rejects.toBeInstanceOf(ProjectLoadError);
});
/** Успешный запрос сохраняет текущую сессию и поддерживает отмену. */
it('получает существующий проект с текущей сессией', async () => {
  const request = vi.fn().mockResolvedValue(Response.json({ id: 12 }));
  vi.stubGlobal('fetch', request);
  const controller = new AbortController();
  await expect(loadEditorProject(12, controller.signal)).resolves.toEqual({ id: 12 });
  expect(request).toHaveBeenCalledWith('/api/projects/12', { credentials: 'include', signal: controller.signal });
});
